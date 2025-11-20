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
  const next = _next?.startsWith('/') ? _next : '/protected'

  // Handle both token_hash (PKCE flow) and token (legacy flow)
  const verificationToken = token_hash || token

  if (verificationToken && type) {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: verificationToken,
    })
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

  // Check if this email exists in bubble_users
  const { data: bubbleUser } = await supabaseAdmin
    .from('bubble_users')
    .select('*')
    .eq('email', emailLower)
    .maybeSingle();

  if (!bubbleUser || bubbleUser.matched_user_id) {
    return; // No match or already matched
  }

  // Check if they have a Stripe customer ID
  if (!bubbleUser.stripe_customer_id || bubbleUser.stripe_customer_id.trim() === '') {
    // Mark as matched but no subscription to transfer
    await supabaseAdmin
      .from('bubble_users')
      .update({
        matched_user_id: userId,
        matched_at: new Date().toISOString(),
      })
      .eq('id', bubbleUser.id);
    return;
  }

  // Transfer subscription
  const stripe = getStripeClient();
  const subscriptions = await stripe.subscriptions.list({
    customer: bubbleUser.stripe_customer_id,
    status: 'all',
    limit: 10,
  });

  if (subscriptions.data.length === 0) {
    await supabaseAdmin
      .from('bubble_users')
      .update({
        matched_user_id: userId,
        matched_at: new Date().toISOString(),
      })
      .eq('id', bubbleUser.id);
    return;
  }

  const foundSubscription = subscriptions.data.find(
    (sub) => sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due'
  ) || subscriptions.data[0];
  if (!foundSubscription) {
    return;
  }
  // Explicitly type as StripeSubscription to avoid conflict with our Subscription interface
  const stripeSubscription: StripeSubscription = foundSubscription;

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
    return; // Silently fail for auto-transfer
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

  await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
    });

  await supabaseAdmin
    .from('bubble_users')
    .update({
      matched_user_id: userId,
      matched_at: new Date().toISOString(),
    })
    .eq('id', bubbleUser.id);
}

