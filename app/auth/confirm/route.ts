import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { getStripeClient } from '@/lib/stripe/client'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Type alias to avoid conflict with our Subscription interface
type StripeSubscription = Stripe.Subscription;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const token = searchParams.get('token')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/dashboard'

  // Handle both token_hash (PKCE flow) and token (legacy flow)
  const verificationToken = token_hash || token

  if (verificationToken && type) {
    const supabase = await createClient()

    // Handle both token_hash (PKCE flow) and token (legacy flow)
    // Note: Email templates use token_hash, so token_hash is the primary flow
    let result;
    if (token_hash) {
      result = await supabase.auth.verifyOtp({
        type,
        token_hash: token_hash,
      });
    } else if (token) {
      // Legacy token flow requires email - try to get from URL or skip
      // Since we're using token_hash in email templates, this is a fallback
      const email = searchParams.get('email');
      if (email) {
        result = await supabase.auth.verifyOtp({
          type,
          token: token,
          email: email,
        });
      } else {
        // If no email provided with legacy token, redirect to error
        redirect(`/auth/error?error=${encodeURIComponent('Email is required for token verification. Please use the link from your email.')}`)
        return;
      }
    } else {
      redirect(`/auth/error?error=${encodeURIComponent('No verification token provided. Please check your email and click the confirmation link.')}`)
      return;
    }

    const { data: { user }, error } = result
    if (!error && user?.email) {
      // Check if this is a Bubble user and transfer subscription
      try {
        await transferBubbleSubscription(user.id, user.email);
      } catch (transferError) {
        // Don't block user if transfer fails - they can do it manually
        console.error('Error transferring Bubble subscription:', transferError);
      }
      
      // redirect user to specified redirect URL or protected page
      redirect(next)
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${encodeURIComponent(error?.message || 'Verification failed')}`)
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=${encodeURIComponent('No verification token provided. Please check your email and click the confirmation link.')}`)
}

// Helper function to transfer Bubble subscription
async function transferBubbleSubscription(userId: string, email: string) {
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

  const emailLower = email.toLowerCase().trim();

  console.log(`[Bubble Transfer] Checking for bubble user with email: ${emailLower}`);

  // Check if this email exists in bubble_users
  const { data: bubbleUser, error: bubbleError } = await supabaseAdmin
    .from('bubble_users')
    .select('*')
    .eq('email', emailLower)
    .maybeSingle();

  if (bubbleError) {
    console.error('[Bubble Transfer] Error querying bubble_users:', bubbleError);
    throw new Error(`Failed to check bubble_users: ${bubbleError.message}`);
  }

  if (!bubbleUser) {
    console.log(`[Bubble Transfer] No bubble user found for email: ${emailLower}`);
    return; // No match - not a Bubble user
  }

  if (bubbleUser.matched_user_id) {
    console.log(`[Bubble Transfer] Bubble user already matched to: ${bubbleUser.matched_user_id}`);
    return; // Already matched
  }

  console.log(`[Bubble Transfer] Found bubble user: ${bubbleUser.id}, stripe_customer_id: ${bubbleUser.stripe_customer_id || 'none'}`);

  // Check if they have a Stripe customer ID
  if (!bubbleUser.stripe_customer_id || bubbleUser.stripe_customer_id.trim() === '') {
    console.log(`[Bubble Transfer] No Stripe customer ID for bubble user: ${bubbleUser.id}`);
    // Mark as matched but no subscription to transfer
    const { error: updateError } = await supabaseAdmin
      .from('bubble_users')
      .update({
        matched_user_id: userId,
        matched_at: new Date().toISOString(),
      })
      .eq('id', bubbleUser.id);
    
    if (updateError) {
      console.error('[Bubble Transfer] Error updating bubble_users:', updateError);
      throw new Error(`Failed to update bubble_users: ${updateError.message}`);
    }
    return;
  }

  // Transfer subscription
  console.log(`[Bubble Transfer] Fetching Stripe subscriptions for customer: ${bubbleUser.stripe_customer_id}`);
  const stripe = getStripeClient();
  
  let subscriptions;
  try {
    subscriptions = await stripe.subscriptions.list({
      customer: bubbleUser.stripe_customer_id,
      status: 'all',
      limit: 10,
    });
  } catch (stripeError) {
    console.error('[Bubble Transfer] Error fetching Stripe subscriptions:', stripeError);
    throw new Error(`Failed to fetch Stripe subscriptions: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`);
  }

  if (subscriptions.data.length === 0) {
    console.log(`[Bubble Transfer] No Stripe subscriptions found for customer: ${bubbleUser.stripe_customer_id}`);
    const { error: updateError } = await supabaseAdmin
      .from('bubble_users')
      .update({
        matched_user_id: userId,
        matched_at: new Date().toISOString(),
      })
      .eq('id', bubbleUser.id);
    
    if (updateError) {
      console.error('[Bubble Transfer] Error updating bubble_users:', updateError);
      throw new Error(`Failed to update bubble_users: ${updateError.message}`);
    }
    return;
  }

  console.log(`[Bubble Transfer] Found ${subscriptions.data.length} subscription(s) for customer`);

  const foundSubscription = subscriptions.data.find(
    (sub) => sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
  ) || subscriptions.data[0];
  if (!foundSubscription) {
    console.error('[Bubble Transfer] No subscription found after filtering');
    return;
  }
  // Explicitly type as StripeSubscription to avoid conflict with our Subscription interface
  const stripeSubscription: StripeSubscription = foundSubscription;
  
  console.log(`[Bubble Transfer] Using subscription: ${stripeSubscription.id}, status: ${stripeSubscription.status}`);

  const metadata = stripeSubscription.metadata;
  let plan: 'learn' | 'accelerate' = 'learn';
  let billingCadence: 'monthly' | 'quarterly' | 'yearly' = 'monthly';

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
    const errorDetails = {
      subscriptionId: stripeSubscription.id,
      current_period_start: periodStartTimestamp,
      current_period_end: periodEndTimestamp,
      subscriptionObject: sub.current_period_start,
      subscriptionObjectEnd: sub.current_period_end,
      firstItem: stripeSubscription.items.data[0] ? {
        start: (stripeSubscription.items.data[0] as any).current_period_start,
        end: (stripeSubscription.items.data[0] as any).current_period_end,
      } : null,
    };
    console.error('[Bubble Transfer] Missing required period dates for subscription:', errorDetails);
    throw new Error(`Missing required period dates for subscription ${stripeSubscription.id}`);
  }

  // For flexible billing mode, Stripe uses cancel_at instead of cancel_at_period_end
  // If cancel_at is set and matches current_period_end (or close), treat as cancel_at_period_end
  const cancelAt = sub.cancel_at;
  const periodEndTimestampNum = periodEndTimestamp;
  const isCancelingAtPeriodEnd = Boolean(sub.cancel_at_period_end) || 
    (cancelAt && periodEndTimestampNum && Math.abs(cancelAt - periodEndTimestampNum) < 86400); // Within 24 hours

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: bubbleUser.stripe_customer_id,
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
    transferred_from_bubble: true,
    transferred_at: new Date().toISOString(),
  };

  console.log(`[Bubble Transfer] Upserting subscription to database:`, {
    stripe_subscription_id: stripeSubscription.id,
    plan,
    billing_cadence: billingCadence,
    status,
  });

  const { error: upsertError } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
    });

  if (upsertError) {
    console.error('[Bubble Transfer] Error upserting subscription:', upsertError);
    throw new Error(`Failed to upsert subscription: ${upsertError.message}`);
  }

  console.log(`[Bubble Transfer] Marking bubble user as matched: ${bubbleUser.id}`);

  const { error: updateError } = await supabaseAdmin
    .from('bubble_users')
    .update({
      matched_user_id: userId,
      matched_at: new Date().toISOString(),
    })
    .eq('id', bubbleUser.id);

  if (updateError) {
    console.error('[Bubble Transfer] Error updating bubble_users:', updateError);
    throw new Error(`Failed to update bubble_users: ${updateError.message}`);
  }

  console.log(`[Bubble Transfer] Successfully transferred subscription for user: ${userId}`);
}

