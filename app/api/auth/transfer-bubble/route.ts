import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import Stripe from 'stripe';

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
    const foundSubscription = (subscriptions.data.find(
      (sub) => sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
    ) || subscriptions.data[0]) as StripeSubscription;
    if (!foundSubscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }
    // Use foundSubscription directly as StripeSubscription
    const stripeSubscription = foundSubscription;

    // Sync subscription to database
    const metadata = stripeSubscription.metadata;
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
      const price = stripeSubscription.items.data[0]?.price;
      if (price) {
        if (price.recurring?.interval === 'month') {
          billingCadence = 'monthly';
        } else if (price.recurring?.interval === 'year') {
          billingCadence = 'yearly';
        }
      }
    }

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

    // Extract values - foundSubscription is definitely a Stripe.Subscription at runtime
    const stripeSub = foundSubscription as unknown as Stripe.Subscription;
    const sub = stripeSub as any;
    
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
    
    const { start: periodStartTimestamp, end: periodEndTimestamp } = getPeriodDates(stripeSub);
    
    // These are required fields - if missing, we should error, not use fallback
    const periodStart = timestampToISO(periodStartTimestamp, 'current_period_start');
    const periodEnd = timestampToISO(periodEndTimestamp, 'current_period_end');
    
    if (!periodStart || !periodEnd) {
      console.error('Missing required period dates for subscription:', {
        subscriptionId: stripeSub.id,
        current_period_start: periodStartTimestamp,
        current_period_end: periodEndTimestamp,
        subscriptionObject: sub.current_period_start,
        subscriptionObjectEnd: sub.current_period_end,
        firstItem: stripeSub.items.data[0] ? {
          start: (stripeSub.items.data[0] as any).current_period_start,
          end: (stripeSub.items.data[0] as any).current_period_end,
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
      stripe_customer_id: bubbleUser.stripe_customer_id,
      stripe_subscription_id: stripeSub.id,
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

