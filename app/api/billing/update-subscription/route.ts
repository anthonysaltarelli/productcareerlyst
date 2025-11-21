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
    const { plan, billingCadence } = body;

    if (!plan || !billingCadence) {
      return NextResponse.json(
        { error: 'Plan and billing cadence are required' },
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

    // Get user's current subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Check if already on the requested plan and billing cadence
    if (subscription.plan === plan && subscription.billing_cadence === billingCadence) {
      return NextResponse.json(
        { error: 'You are already on this plan and billing cycle' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const newPriceId = STRIPE_PRICE_IDS[plan as 'learn' | 'accelerate'][billingCadence as 'monthly' | 'quarterly' | 'yearly'];

    // Get the Stripe subscription
    const stripeSubscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    // Update the subscription with the new price
    // Stripe automatically handles proration when proration_behavior is set to 'always_invoice' or 'create_prorations'
    // If subscription was set to cancel at period end, updating it will automatically remove that cancellation
    const updateParams: Stripe.SubscriptionUpdateParams = {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      metadata: {
        user_id: user.id,
        plan: plan,
        billing_cadence: billingCadence,
      },
      proration_behavior: 'always_invoice', // Automatically prorate and charge immediately
    };

    // If subscription was set to cancel at period end, remove that cancellation
    if (subscription.cancel_at_period_end) {
      updateParams.cancel_at_period_end = false;
    }

    const updatedSubscription: Stripe.Subscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      updateParams
    );

    // Sync the updated subscription to the database
    const metadata = updatedSubscription.metadata;
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

    const status = statusMap[updatedSubscription.status] || 'incomplete';

    const timestampToISO = (timestamp: number | null | undefined, fieldName: string, isOptional: boolean = false): string | null => {
      if (timestamp === null || timestamp === undefined) {
        if (!isOptional) {
          console.warn(`Missing ${fieldName} in subscription ${updatedSubscription.id}`);
        }
        return null;
      }
      if (typeof timestamp !== 'number') {
        console.warn(`Invalid ${fieldName} type in subscription ${updatedSubscription.id}:`, typeof timestamp);
        return null;
      }
      const date = new Date(timestamp * 1000);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid ${fieldName} date in subscription ${updatedSubscription.id}:`, timestamp);
        return null;
      }
      return date.toISOString();
    };

    const sub = updatedSubscription as any;
    
    // Helper to extract period dates - for flexible billing, they're on subscription items
    const getPeriodDates = (subscription: Stripe.Subscription) => {
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
    
    const { start: periodStartTimestamp, end: periodEndTimestamp } = getPeriodDates(updatedSubscription);
    
    // These are required fields - if missing, we should error, not use fallback
    const periodStart = timestampToISO(periodStartTimestamp, 'current_period_start');
    const periodEnd = timestampToISO(periodEndTimestamp, 'current_period_end');
    
    if (!periodStart || !periodEnd) {
      console.error('Missing required period dates for subscription:', {
        subscriptionId: updatedSubscription.id,
        current_period_start: periodStartTimestamp,
        current_period_end: periodEndTimestamp,
        subscriptionObject: sub.current_period_start,
        subscriptionObjectEnd: sub.current_period_end,
        firstItem: updatedSubscription.items.data[0] ? {
          start: (updatedSubscription.items.data[0] as any).current_period_start,
          end: (updatedSubscription.items.data[0] as any).current_period_end,
        } : null,
      });
      return NextResponse.json(
        { error: 'Subscription missing required period dates' },
        { status: 400 }
      );
    }

    const cancelAt = sub.cancel_at;
    const isCancelingAtPeriodEnd = Boolean(sub.cancel_at_period_end) || 
      (cancelAt && periodEndTimestamp && Math.abs(cancelAt - periodEndTimestamp) < 86400);

    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: subscription.stripe_customer_id,
      stripe_subscription_id: updatedSubscription.id,
      plan,
      billing_cadence: billingCadence,
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: isCancelingAtPeriodEnd,
      canceled_at: timestampToISO(sub.canceled_at, 'canceled_at', true),
      trial_start: timestampToISO(sub.trial_start, 'trial_start', true),
      trial_end: timestampToISO(sub.trial_end, 'trial_end', true),
      stripe_price_id: newPriceId,
      updated_at: new Date().toISOString(),
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
      message: 'Subscription updated successfully',
      subscription: {
        plan,
        billingCadence,
        status,
      },
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update subscription' },
      { status: 500 }
    );
  }
};

