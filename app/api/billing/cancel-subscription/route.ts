import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';
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
    const { cancel } = body;

    if (typeof cancel !== 'boolean') {
      return NextResponse.json(
        { error: 'Cancel parameter is required and must be a boolean' },
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

    const stripe = getStripeClient();

    // Update the subscription
    const updateParams: Stripe.SubscriptionUpdateParams = {
      cancel_at_period_end: cancel,
      metadata: {
        user_id: user.id,
        plan: subscription.plan,
        billing_cadence: subscription.billing_cadence,
      },
    };

    const updatedSubscription = await stripe.subscriptions.update(
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

    // Helper function to safely convert timestamp to ISO string
    const timestampToISO = (timestamp: number | null | undefined, fieldName: string, optional: boolean = false): string | null => {
      if (timestamp === null || timestamp === undefined) {
        if (!optional) {
          console.warn(`Warning: ${fieldName} is null or undefined`);
        }
        return null;
      }
      return new Date(timestamp * 1000).toISOString();
    };

    const periodStart = timestampToISO(updatedSubscription.current_period_start, 'current_period_start');
    const periodEnd = timestampToISO(updatedSubscription.current_period_end, 'current_period_end');
    const periodEndTimestamp = updatedSubscription.current_period_end;

    // For flexible billing mode, Stripe uses cancel_at instead of cancel_at_period_end
    const cancelAt = updatedSubscription.cancel_at;
    const periodEndTimestampNum = periodEndTimestamp;
    const isCancelingAtPeriodEnd = Boolean(updatedSubscription.cancel_at_period_end) || 
      (cancelAt && periodEndTimestampNum && Math.abs(cancelAt - periodEndTimestampNum) < 86400);

    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: subscription.stripe_customer_id,
      stripe_subscription_id: updatedSubscription.id,
      plan: subscription.plan,
      billing_cadence: subscription.billing_cadence,
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: isCancelingAtPeriodEnd,
      canceled_at: timestampToISO(updatedSubscription.canceled_at, 'canceled_at', true),
      trial_start: timestampToISO(updatedSubscription.trial_start, 'trial_start', true),
      trial_end: timestampToISO(updatedSubscription.trial_end, 'trial_end', true),
      stripe_price_id: subscription.stripe_price_id,
    };

    // Upsert subscription
    const { error: dbError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'stripe_subscription_id',
      });

    if (dbError) {
      console.error('Error updating subscription in database:', dbError);
      return NextResponse.json(
        { error: 'Failed to update subscription in database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cancel_at_period_end: isCancelingAtPeriodEnd,
    });
  } catch (error) {
    console.error('Error canceling/reactivating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
};

