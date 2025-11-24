import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { resolvePlanAndCadenceFromSubscription } from '@/lib/stripe/plan-utils';

// Type alias to avoid conflict with our Subscription interface
type StripeSubscription = Stripe.Subscription;

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
    const { email, stripeCustomerId } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();

    // If Stripe customer ID is provided, use it directly
    let customerId = stripeCustomerId;

    if (!customerId) {
      // Try to find customer by email
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return NextResponse.json(
          { error: 'No Stripe customer found with this email. Please provide your Stripe customer ID.' },
          { status: 404 }
        );
      }

      customerId = customers.data[0].id;
    } else {
      // Verify the customer exists
      try {
        await stripe.customers.retrieve(customerId);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid Stripe customer ID' },
          { status: 400 }
        );
      }
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'No active subscriptions found for this customer' },
        { status: 404 }
      );
    }

    // Find the most recent active subscription
    const foundSubscription = subscriptions.data.find(
      (sub) => sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
    ) || subscriptions.data[0];
    if (!foundSubscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }
    // Explicitly type as StripeSubscription to avoid conflict with our Subscription interface
    const stripeSubscription: StripeSubscription = foundSubscription;

    // Update customer metadata with new user ID
    await stripe.customers.update(customerId, {
      metadata: {
        user_id: user.id,
        transferred_from_bubble: 'true',
        transfer_date: new Date().toISOString(),
      },
    });

    const { plan, billingCadence } = resolvePlanAndCadenceFromSubscription(stripeSubscription);

    const priceId = stripeSubscription.items.data[0]?.price.id || '';

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

    const status = statusMap[stripeSubscription.status] || 'incomplete';

    // Helper function to safely convert timestamp to ISO string
    // Optional fields (canceled_at, trial_start, trial_end) can be null - don't warn for those
    const timestampToISO = (timestamp: number | null | undefined, fieldName: string, isOptional: boolean = false): string | null => {
      if (timestamp === null || timestamp === undefined) {
        if (!isOptional) {
          console.warn(`Missing ${fieldName} in subscription ${stripeSubscription.id}`);
        }
        return null;
      }
      if (typeof timestamp !== 'number') {
        console.warn(`Invalid ${fieldName} type in subscription ${stripeSubscription.id}:`, typeof timestamp);
        return null;
      }
      const date = new Date(timestamp * 1000);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid ${fieldName} date in subscription ${stripeSubscription.id}:`, timestamp);
        return null;
      }
      return date.toISOString();
    };

    const sub = stripeSubscription as any;
    
    // Helper to extract period dates - for flexible billing, they're on subscription items
    const getPeriodDates = (subscription: StripeSubscription) => {
      const subAny = subscription as any;
      
      // Try subscription object first
      let start = subAny.current_period_start;
      let end = subAny.current_period_end;
      
      // If not on subscription object, check subscription items (for flexible billing mode)
      if (!start || !end) {
        const firstItem = subscription.items.data[0];
        if (firstItem) {
          const itemAny = firstItem as any;
          start = itemAny.current_period_start || start;
          end = itemAny.current_period_end || end;
        }
      }
      
      return { start, end };
    };
    
    const { start: periodStartTimestamp, end: periodEndTimestamp } = getPeriodDates(stripeSubscription);
    
    // These are required fields - if missing, we should error, not use fallback
    const periodStart = timestampToISO(periodStartTimestamp, 'current_period_start');
    const periodEnd = timestampToISO(periodEndTimestamp, 'current_period_end');
    
    if (!periodStart || !periodEnd) {
      console.error('Missing required period dates for subscription:', {
        subscriptionId: stripeSubscription.id,
        current_period_start: periodStartTimestamp,
        current_period_end: periodEndTimestamp,
        subscriptionObject: sub.current_period_start,
        subscriptionObjectEnd: sub.current_period_end,
        firstItem: stripeSubscription.items.data[0] ? {
          start: (stripeSubscription.items.data[0] as any).current_period_start,
          end: (stripeSubscription.items.data[0] as any).current_period_end,
        } : null,
      });
      return NextResponse.json(
        { error: 'Subscription missing required period dates' },
        { status: 400 }
      );
    }

    // For flexible billing mode, Stripe uses cancel_at instead of cancel_at_period_end
    // If cancel_at is set and matches current_period_end (or close), treat as cancel_at_period_end
    const cancelAt = sub.cancel_at;
    const periodEndTimestampNum = periodEndTimestamp;
    const isCancelingAtPeriodEnd = Boolean(sub.cancel_at_period_end) || 
      (cancelAt && periodEndTimestampNum && Math.abs(cancelAt - periodEndTimestampNum) < 86400); // Within 24 hours

    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscription.id,
      plan,
      billing_cadence: billingCadence,
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: isCancelingAtPeriodEnd,
      canceled_at: timestampToISO(sub.canceled_at, 'canceled_at', true), // Optional field
      trial_start: timestampToISO(sub.trial_start, 'trial_start', true), // Optional field
      trial_end: timestampToISO(sub.trial_end, 'trial_end', true), // Optional field
      stripe_price_id: priceId,
    };

    // Upsert subscription
    const { error: dbError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'stripe_subscription_id',
      });

    if (dbError) {
      console.error('Error syncing subscription to database:', dbError);
      return NextResponse.json(
        { error: 'Failed to sync subscription to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription transferred successfully',
      subscription: {
        plan,
        billingCadence,
        status,
      },
    });
  } catch (error) {
    console.error('Error transferring subscription:', error);
    return NextResponse.json(
      { error: 'Failed to transfer subscription' },
      { status: 500 }
    );
  }
};

