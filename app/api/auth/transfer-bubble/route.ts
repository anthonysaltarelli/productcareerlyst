import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

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

/**
 * Auto-transfer Bubble subscription when user signs up
 * This is called after user signup/email confirmation
 */
export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const email = user.email.toLowerCase().trim();

    // Check if this email exists in bubble_users
    const { data: bubbleUser, error: bubbleError } = await supabaseAdmin
      .from('bubble_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (bubbleError) {
      console.error('Error checking bubble_users:', bubbleError);
      return NextResponse.json(
        { error: 'Failed to check migration data' },
        { status: 500 }
      );
    }

    // No match found - not a Bubble user
    if (!bubbleUser) {
      return NextResponse.json({
        transferred: false,
        message: 'No matching Bubble user found',
      });
    }

    // Already matched
    if (bubbleUser.matched_user_id) {
      return NextResponse.json({
        transferred: true,
        message: 'Already transferred',
        matched_at: bubbleUser.matched_at,
      });
    }

    // Check if they have a Stripe customer ID
    if (!bubbleUser.stripe_customer_id || bubbleUser.stripe_customer_id.trim() === '') {
      // Mark as matched but no subscription to transfer
      await supabaseAdmin
        .from('bubble_users')
        .update({
          matched_user_id: user.id,
          matched_at: new Date().toISOString(),
        })
        .eq('id', bubbleUser.id);

      return NextResponse.json({
        transferred: false,
        message: 'Bubble user found but no active subscription',
      });
    }

    // Transfer subscription
    const stripe = getStripeClient();

    // Get customer's subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: bubbleUser.stripe_customer_id,
      status: 'all',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      // Mark as matched but no subscription found
      await supabaseAdmin
        .from('bubble_users')
        .update({
          matched_user_id: user.id,
          matched_at: new Date().toISOString(),
        })
        .eq('id', bubbleUser.id);

      return NextResponse.json({
        transferred: false,
        message: 'Bubble user found but no Stripe subscription found',
      });
    }

    // Find the most recent active subscription
    const activeSubscription = subscriptions.data.find(
      (sub) => sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
    ) || subscriptions.data[0];

    // Sync subscription to database
    const metadata = activeSubscription.metadata;
    let plan: 'learn' | 'accelerate' = 'learn';
    let billingCadence: 'monthly' | 'quarterly' | 'yearly' = 'monthly';

    // Try to infer from Bubble data first
    if (bubbleUser.current_plan) {
      const planLower = bubbleUser.current_plan.toLowerCase();
      if (planLower.includes('accelerate') || planLower.includes('pro')) {
        plan = 'accelerate';
      }
    }

    if (metadata.plan) {
      plan = metadata.plan as 'learn' | 'accelerate';
    }

    if (bubbleUser.subscription_frequency) {
      const freq = bubbleUser.subscription_frequency.toLowerCase();
      if (freq.includes('month')) billingCadence = 'monthly';
      if (freq.includes('quarter')) billingCadence = 'quarterly';
      if (freq.includes('year')) billingCadence = 'yearly';
    }

    if (metadata.billing_cadence) {
      billingCadence = metadata.billing_cadence as 'monthly' | 'quarterly' | 'yearly';
    } else {
      // Infer from price interval
      const price = activeSubscription.items.data[0]?.price;
      if (price) {
        if (price.recurring?.interval === 'month') {
          billingCadence = 'monthly';
        } else if (price.recurring?.interval === 'year') {
          billingCadence = 'yearly';
        }
      }
    }

    const priceId = activeSubscription.items.data[0]?.price.id || '';

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

    const status = statusMap[activeSubscription.status] || 'incomplete';

    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: bubbleUser.stripe_customer_id,
      stripe_subscription_id: activeSubscription.id,
      plan,
      billing_cadence: billingCadence,
      status,
      current_period_start: new Date(activeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: activeSubscription.cancel_at_period_end,
      canceled_at: activeSubscription.canceled_at ? new Date(activeSubscription.canceled_at * 1000).toISOString() : null,
      trial_start: activeSubscription.trial_start ? new Date(activeSubscription.trial_start * 1000).toISOString() : null,
      trial_end: activeSubscription.trial_end ? new Date(activeSubscription.trial_end * 1000).toISOString() : null,
      stripe_price_id: priceId,
      transferred_from_bubble: true,
      transferred_at: new Date().toISOString(),
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

    // Mark bubble user as matched
    await supabaseAdmin
      .from('bubble_users')
      .update({
        matched_user_id: user.id,
        matched_at: new Date().toISOString(),
      })
      .eq('id', bubbleUser.id);

    return NextResponse.json({
      transferred: true,
      message: 'Subscription transferred successfully',
      subscription: {
        plan,
        billingCadence,
        status,
      },
    });
  } catch (error) {
    console.error('Error transferring Bubble subscription:', error);
    return NextResponse.json(
      { error: 'Failed to transfer subscription' },
      { status: 500 }
    );
  }
};

