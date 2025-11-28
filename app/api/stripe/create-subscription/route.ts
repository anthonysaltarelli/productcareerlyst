import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient, STRIPE_PRICE_IDS } from '@/lib/stripe/client';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role client for admin operations
const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, billingCadence, paymentMethodId, trialPeriodDays, couponCode } = body;

    if (!plan || !billingCadence || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Plan, billing cadence, and payment method are required' },
        { status: 400 }
      );
    }

    if (plan !== 'learn' && plan !== 'accelerate') {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    if (!['monthly', 'quarterly', 'yearly'].includes(billingCadence)) {
      return NextResponse.json(
        { error: 'Invalid billing cadence' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const priceId = STRIPE_PRICE_IDS[plan as 'learn' | 'accelerate'][billingCadence as 'monthly' | 'quarterly' | 'yearly'];

    // Check if user already has a Stripe customer ID
    let customerId: string;
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;
    } else {
      // Check if customer was created in create-payment-intent but not yet saved
      // Try to find customer by email in Stripe
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Save to database for future use
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            status: 'incomplete',
          }, {
            onConflict: 'user_id',
          });
      } else {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
          },
        });
        customerId = customer.id;
        // Save to database
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            status: 'incomplete',
          }, {
            onConflict: 'user_id',
          });
      }
    }

    // Check if payment method is already attached to the correct customer
    // The setup intent should have already attached it, but we verify here
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (!paymentMethod.customer) {
        // Not attached to any customer, attach it
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
      } else if (paymentMethod.customer !== customerId) {
        // Attached to a different customer - this shouldn't happen with our flow
        // but if it does, we can't reuse the payment method
        return NextResponse.json(
          { error: 'Payment method is associated with a different account. Please use a different card.' },
          { status: 400 }
        );
      }
      // If already attached to this customer, no action needed
    } catch (attachError: any) {
      // Handle specific Stripe errors
      if (attachError.code === 'resource_already_exists' || 
          attachError.message?.includes('already been attached')) {
        // Payment method is already attached, continue
      } else if (attachError.message?.includes('previously used') || 
                 attachError.message?.includes('may not be used again')) {
        // Payment method was detached and can't be reused
        return NextResponse.json(
          { error: 'This payment method cannot be reused. Please enter a new card.' },
          { status: 400 }
        );
      } else {
        throw attachError;
      }
    }

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription with payment method
    // Using default_payment_method ensures immediate payment
    const subscriptionParams: any = {
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      default_payment_method: paymentMethodId,
      metadata: {
        user_id: user.id,
        plan,
        billing_cadence: billingCadence,
      },
    };

    // Add trial period if specified (for onboarding)
    if (trialPeriodDays && typeof trialPeriodDays === 'number' && trialPeriodDays > 0) {
      subscriptionParams.trial_period_days = trialPeriodDays;
    }

    // Add coupon/promotion code if specified
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      subscriptionParams.discounts = [{ coupon: couponCode.trim() }];
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    // Immediately sync subscription to database so it appears on billing page
    try {
      await syncSubscriptionToDatabase(subscription, customerId, user.id, plan, billingCadence);
    } catch (syncError) {
      // Log error but don't fail the request - webhook will sync it eventually
      console.error('Error syncing subscription immediately after creation:', syncError);
    }

    return NextResponse.json({ 
      success: true,
      subscriptionId: subscription.id,
      customerId,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: error.message || 'Card payment failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
};

// Sync subscription to database (same logic as webhook)
async function syncSubscriptionToDatabase(
  subscription: Stripe.Subscription,
  customerId: string,
  userId: string,
  plan: 'learn' | 'accelerate',
  billingCadence: 'monthly' | 'quarterly' | 'yearly'
) {
  const priceId = subscription.items.data[0]?.price.id || '';

  // Map Stripe status to our enum
  const statusMap: Record<string, 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | 'paused'> = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    past_due: 'past_due',
    trialing: 'trialing',
    unpaid: 'unpaid',
    paused: 'paused',
  };

  const status = statusMap[subscription.status] || 'incomplete';

  // Helper function to safely convert timestamp to ISO string
  const timestampToISO = (timestamp: number | null | undefined, fieldName: string, isOptional: boolean = false): string | null => {
    if (timestamp === null || timestamp === undefined) {
      if (!isOptional) {
        console.warn(`Missing ${fieldName} in subscription ${subscription.id}`);
      }
      return null;
    }
    if (typeof timestamp !== 'number') {
      console.warn(`Invalid ${fieldName} type in subscription ${subscription.id}:`, typeof timestamp);
      return null;
    }
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid ${fieldName} date in subscription ${subscription.id}:`, timestamp);
      return null;
    }
    return date.toISOString();
  };

  const sub = subscription as any;
  
  // Helper function to get period dates (similar to webhook logic)
  const getPeriodDates = (sub: Stripe.Subscription) => {
    const subAny = sub as any;
    
    // Try subscription object first
    let start = subAny.current_period_start;
    let end = subAny.current_period_end;
    
    // If not on subscription object, check subscription items (for flexible billing mode)
    if (!start || !end) {
      const firstItem = sub.items.data[0];
      if (firstItem) {
        const itemAny = firstItem as any;
        start = itemAny.current_period_start || start;
        end = itemAny.current_period_end || end;
      }
    }
    
    // For trial subscriptions, use trial dates if current_period dates are missing
    if (!start && subAny.trial_start) {
      start = subAny.trial_start;
    } else if (!start && subAny.created) {
      // Fallback to subscription creation time
      start = subAny.created;
    }
    
    if (!end && subAny.trial_end) {
      end = subAny.trial_end;
    } else if (!end && start && subAny.trial_period_days) {
      // Calculate trial end from trial start + trial days
      end = start + (subAny.trial_period_days * 86400);
    } else if (!end && start) {
      // If we have start but no end, calculate based on billing interval
      const interval = subscription.items.data[0]?.price.recurring?.interval;
      const intervalCount = subscription.items.data[0]?.price.recurring?.interval_count || 1;
      let daysToAdd = 30; // Default to monthly
      
      if (interval === 'day') {
        daysToAdd = intervalCount;
      } else if (interval === 'week') {
        daysToAdd = intervalCount * 7;
      } else if (interval === 'month') {
        daysToAdd = intervalCount * 30;
      } else if (interval === 'year') {
        daysToAdd = intervalCount * 365;
      }
      
      end = start + (daysToAdd * 86400);
    }
    
    return { start, end };
  };
  
  const { start: periodStartTimestamp, end: periodEndTimestamp } = getPeriodDates(subscription);
  
  const periodStart = timestampToISO(periodStartTimestamp, 'current_period_start');
  const periodEnd = timestampToISO(periodEndTimestamp, 'current_period_end');
  
  if (!periodStart || !periodEnd) {
    console.error('Missing required period dates for subscription:', {
      subscriptionId: subscription.id,
      status: subscription.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      trial_start: sub.trial_start,
      trial_end: sub.trial_end,
      trial_period_days: sub.trial_period_days,
      created: sub.created,
      calculatedStart: periodStartTimestamp,
      calculatedEnd: periodEndTimestamp,
    });
    throw new Error('Subscription missing required period dates');
  }

  // Check if canceling at period end
  const cancelAt = sub.cancel_at;
  const isCancelingAtPeriodEnd = Boolean(sub.cancel_at_period_end) || 
    (cancelAt && periodEndTimestamp && Math.abs(cancelAt - periodEndTimestamp) < 86400);

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan,
    billing_cadence: billingCadence,
    status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: isCancelingAtPeriodEnd,
    canceled_at: timestampToISO(sub.canceled_at, 'canceled_at', true),
    trial_start: timestampToISO(sub.trial_start, 'trial_start', true),
    trial_end: timestampToISO(sub.trial_end, 'trial_end', true),
    stripe_price_id: priceId,
  };

  // Upsert subscription
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('Error syncing subscription to database:', error);
    throw error;
  }
}

