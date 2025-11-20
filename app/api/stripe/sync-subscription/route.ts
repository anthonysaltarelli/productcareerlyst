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

    const stripe = getStripeClient();

    // Get user's Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = existingSubscription?.stripe_customer_id;

    // If no customer ID, try to find by email
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: user.email || '',
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        return NextResponse.json(
          { error: 'No Stripe customer found. Please complete checkout first.' },
          { status: 404 }
        );
      }
    }

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'No subscriptions found' },
        { status: 404 }
      );
    }

    // Find the most recent active subscription
    const activeSubscription = subscriptions.data.find(
      (sub) => sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
    ) || subscriptions.data[0];

    // Sync subscription to database (same logic as webhook)
    const metadata = activeSubscription.metadata;
    let plan: 'learn' | 'accelerate' = 'learn';
    let billingCadence: 'monthly' | 'quarterly' | 'yearly' = 'monthly';

    if (metadata.plan) {
      plan = metadata.plan as 'learn' | 'accelerate';
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
      stripe_customer_id: customerId,
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
      subscription: subscriptionData,
    });
  } catch (error) {
    console.error('Error syncing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    );
  }
};

