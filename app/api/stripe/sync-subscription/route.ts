import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';
import { createClient as createSupabaseAdmin, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { tagSubscriber } from '@/lib/utils/convertkit';
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

/**
 * Helper function to unpublish a user's portfolio if they're not on the Accelerate plan
 * or if their subscription is not active/trialing.
 * 
 * Portfolio feature requires an active Accelerate subscription - if the user downgrades
 * or cancels, their portfolio should be unpublished to prevent public access.
 */
const unpublishUserPortfolioIfNotAccelerate = async (
  client: SupabaseClient,
  userId: string,
  plan: string,
  status: string
): Promise<void> => {
  // Only Accelerate plan users with active/trialing status can have published portfolios
  const canHavePublishedPortfolio = plan === 'accelerate' && (status === 'active' || status === 'trialing');
  
  if (canHavePublishedPortfolio) {
    return; // User is eligible, no action needed
  }
  
  try {
    // Check if user has a published portfolio
    const { data: portfolio, error: fetchError } = await client
      .from('portfolios')
      .select('id, is_published, slug')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('[Portfolio] Error checking portfolio for unpublish:', fetchError);
      return;
    }
    
    // If no portfolio or already unpublished, nothing to do
    if (!portfolio || !portfolio.is_published) {
      return;
    }
    
    // Unpublish the portfolio
    const { error: updateError } = await client
      .from('portfolios')
      .update({ is_published: false, updated_at: new Date().toISOString() })
      .eq('id', portfolio.id);
    
    if (updateError) {
      console.error('[Portfolio] Error unpublishing portfolio:', updateError);
      return;
    }
    
    console.log(`[Portfolio] Unpublished portfolio for user ${userId} (slug: ${portfolio.slug}) - reason: plan=${plan}, status=${status}`);
  } catch (error) {
    // Don't fail the subscription sync if portfolio unpublish fails - just log
    console.error('[Portfolio] Unexpected error unpublishing portfolio:', error);
  }
};

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

    // Debug: Log the full subscription object to see what Stripe is returning
    console.log('Full Stripe subscription object:', JSON.stringify(stripeSubscription, null, 2));
    console.log('cancel_at_period_end from subscription:', (stripeSubscription as any).cancel_at_period_end);
    console.log('cancel_at from subscription:', (stripeSubscription as any).cancel_at);
    console.log('cancel_at_period_end type:', typeof (stripeSubscription as any).cancel_at_period_end);

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
        billing_cycle_anchor: sub.billing_cycle_anchor,
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

    console.log('Subscription sync - cancellation check:', {
      subscriptionId: stripeSubscription.id,
      cancel_at_period_end: sub.cancel_at_period_end,
      cancel_at: cancelAt,
      cancel_at_date: cancelAt ? new Date(cancelAt * 1000).toISOString() : null,
      current_period_end: periodEndTimestampNum,
      current_period_end_date: periodEndTimestampNum ? new Date(periodEndTimestampNum * 1000).toISOString() : null,
      isCancelingAtPeriodEnd,
      status: stripeSubscription.status,
    });

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

    // Tag subscriber in ConvertKit if they have an active/trialing paid plan subscription
    // Only tag for 'learn' or 'accelerate' plans when status is 'active' or 'trialing'
    if ((status === 'active' || status === 'trialing') && (plan === 'learn' || plan === 'accelerate')) {
      try {
        if (user.email) {
          const PRODUCT_CAREERLYST_SUBSCRIBER_TAG_ID = 5458897;
          await tagSubscriber(PRODUCT_CAREERLYST_SUBSCRIBER_TAG_ID, user.email);
          console.log(`[ConvertKit] Tagged ${user.email} as ProductCareerlystSubscriber`);
        } else {
          console.warn(`[ConvertKit] Could not get user email for userId ${user.id} to tag subscriber`);
        }
      } catch (tagError) {
        // Don't fail the sync if tagging fails - log and continue
        console.error('[ConvertKit] Error tagging subscriber:', tagError);
      }
    }

    // Unpublish portfolio if user is no longer on Accelerate plan with active/trialing status
    // This ensures users who downgrade or cancel can't keep their public portfolio accessible
    await unpublishUserPortfolioIfNotAccelerate(supabaseAdmin, user.id, plan, status);

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

