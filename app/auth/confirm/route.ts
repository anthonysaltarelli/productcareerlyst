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

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: bubbleUser.stripe_customer_id,
    stripe_subscription_id: stripeSubscription.id,
    plan,
    billing_cadence: billingCadence,
    status,
    current_period_start: new Date((stripeSubscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
    cancel_at_period_end: (stripeSubscription as any).cancel_at_period_end,
    canceled_at: (stripeSubscription as any).canceled_at ? new Date((stripeSubscription as any).canceled_at * 1000).toISOString() : null,
    trial_start: (stripeSubscription as any).trial_start ? new Date((stripeSubscription as any).trial_start * 1000).toISOString() : null,
    trial_end: (stripeSubscription as any).trial_end ? new Date((stripeSubscription as any).trial_end * 1000).toISOString() : null,
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

