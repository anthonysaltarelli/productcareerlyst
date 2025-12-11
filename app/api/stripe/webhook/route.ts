import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { tagSubscriber } from '@/lib/utils/convertkit';
import { resolvePlanAndCadenceFromSubscription } from '@/lib/stripe/plan-utils';
import { getAllFlows } from '@/lib/email/flows';
import { cancelSequence } from '@/lib/email/service';

// Disable body parsing for webhook to get raw body
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Use service role client for webhook to bypass RLS
const supabaseAdmin = createClient(
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

/**
 * Store webhook event in database for debugging and audit purposes
 */
const storeWebhookEvent = async (
  event: Stripe.Event,
  signature: string | null,
  ipAddress: string | null
): Promise<string | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        stripe_event_type: event.type,
        payload: event,
        stripe_created_at: new Date(event.created * 1000).toISOString(),
        stripe_signature: signature?.substring(0, 100), // Store first 100 chars only
        ip_address: ipAddress,
      })
      .select('id')
      .single();

    if (error) {
      // Don't fail the webhook if logging fails - just warn
      console.warn('[Webhook] Failed to store event in database:', error.message);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.warn('[Webhook] Exception storing event:', err);
    return null;
  }
};

/**
 * Update webhook event record after processing
 */
const updateWebhookEventStatus = async (
  eventId: string | null,
  processed: boolean,
  error?: string
): Promise<void> => {
  if (!eventId) return;

  try {
    await supabaseAdmin
      .from('webhook_events')
      .update({
        processed,
        processing_error: error || null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventId);
  } catch (err) {
    // Don't fail if update fails
    console.warn('[Webhook] Failed to update event status:', err);
  }
};

export const POST = async (request: NextRequest) => {
  const stripe = getStripeClient();
  
  // Get IP address for logging
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    null;
  
  // Get raw body as Buffer for proper signature verification
  // This ensures the exact bytes Stripe sent are used for verification
  const bodyBuffer = await request.arrayBuffer();
  const body = Buffer.from(bodyBuffer);
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Use Buffer for signature verification - this is the recommended approach
    // The body must be the exact raw bytes Stripe sent, not a parsed/stringified version
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message);
    return NextResponse.json(
      { 
        error: 'Invalid signature',
        details: process.env.NODE_ENV === 'development' ? err?.message : undefined
      },
      { status: 400 }
    );
  }

  // Store the event in database for debugging/audit (non-blocking)
  const webhookEventId = await storeWebhookEvent(event, signature, ipAddress);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as successfully processed
    await updateWebhookEventStatus(webhookEventId, true);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Mark event as failed with error message
    await updateWebhookEventStatus(
      webhookEventId, 
      false, 
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    console.error('No subscription ID in checkout session');
    return;
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscriptionToDatabase(subscription, customerId);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  await syncSubscriptionToDatabase(subscription, customerId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata;
  const userId = metadata?.user_id;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating canceled subscription:', error);
  }

  // Unpublish portfolio when subscription is deleted/canceled
  if (userId) {
    await unpublishUserPortfolioIfNotAccelerate(supabaseAdmin, userId, 'none', 'canceled');
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) return;

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = subscription.customer as string;
  await syncSubscriptionToDatabase(subscription, customerId);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  // Get the subscription to find the user_id before updating
  const { data: subscriptionData } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, plan')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating subscription to past_due:', error);
  }

  // Unpublish portfolio when payment fails (past_due status)
  // This ensures users with payment issues can't keep their public portfolio accessible
  if (subscriptionData?.user_id) {
    await unpublishUserPortfolioIfNotAccelerate(
      supabaseAdmin, 
      subscriptionData.user_id, 
      subscriptionData.plan || 'none', 
      'past_due'
    );
  }
}

async function syncSubscriptionToDatabase(
  subscription: Stripe.Subscription,
  customerId: string
) {
  // Debug: Log the full subscription object to see what Stripe is returning
  console.log('Webhook - Full Stripe subscription object:', JSON.stringify(subscription, null, 2));
  console.log('Webhook - cancel_at_period_end from subscription:', (subscription as any).cancel_at_period_end);
  console.log('Webhook - cancel_at from subscription:', (subscription as any).cancel_at);
  
  const metadata = subscription.metadata;
  const userId = metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  const { plan, billingCadence } = resolvePlanAndCadenceFromSubscription(subscription);

  const priceId = subscription.items.data[0]?.price.id || '';

  // Map Stripe status to our enum
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

  const status = statusMap[subscription.status] || 'incomplete';

  // Check if subscription status changed from trialing to active (user upgraded)
  // Query existing subscription to get previous status
  const { data: existingSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const previousStatus = existingSubscription?.status;
  const isUpgradeFromTrial = previousStatus === 'trialing' && status === 'active';

  // Helper function to safely convert timestamp to ISO string
  // Optional fields (canceled_at, trial_start, trial_end) can be null - don't warn for those
  const timestampToISO = (timestamp: number | null | undefined, fieldName: string, isOptional: boolean = false): string | null => {
    if (timestamp === null || timestamp === undefined) {
      if (!isOptional) {
        console.warn(`Missing ${fieldName} in subscription ${subscription.id}`);
      }
      return null;
    }
    if (typeof timestamp !== 'number') {
      console.warn(`Invalid ${fieldName} type in subscription ${subscription.id}:`, typeof timestamp);
      return null;
    }
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid ${fieldName} date in subscription ${subscription.id}:`, timestamp);
      return null;
    }
    return date.toISOString();
  };

  const sub = subscription as any;
  
  // Log cancel_at_period_end for debugging
  console.log('Webhook sync - cancel_at_period_end:', {
    subscriptionId: subscription.id,
    cancel_at_period_end: sub.cancel_at_period_end,
    status: subscription.status,
    eventType: 'subscription.updated',
  });
  
  // Helper to extract period dates - for flexible billing, they're on subscription items
  const getPeriodDates = (sub: Stripe.Subscription) => {
    const subAny = sub as any;
    
    // Try subscription object first
    let start = subAny.current_period_start;
    let end = subAny.current_period_end;
    
    // If not on subscription object, check subscription items (for flexible billing mode)
    if (!start || !end) {
      const firstItem = sub.items.data[0];
      if (firstItem) {
        const itemAny = firstItem as any;
        start = itemAny.current_period_start || start;
        end = itemAny.current_period_end || end;
      }
    }
    
    return { start, end };
  };
  
  const { start: periodStartTimestamp, end: periodEndTimestamp } = getPeriodDates(subscription);
  
  // These are required fields - if missing, we should error, not use fallback
  const periodStart = timestampToISO(periodStartTimestamp, 'current_period_start');
  const periodEnd = timestampToISO(periodEndTimestamp, 'current_period_end');
  
  if (!periodStart || !periodEnd) {
    console.error('Missing required period dates for subscription:', {
      subscriptionId: subscription.id,
      current_period_start: periodStartTimestamp,
      current_period_end: periodEndTimestamp,
      subscriptionObject: sub.current_period_start,
      subscriptionObjectEnd: sub.current_period_end,
      firstItem: subscription.items.data[0] ? {
        start: (subscription.items.data[0] as any).current_period_start,
        end: (subscription.items.data[0] as any).current_period_end,
      } : null,
    });
    throw new Error('Subscription missing required period dates');
  }

  // For flexible billing mode, Stripe uses cancel_at instead of cancel_at_period_end
  // If cancel_at is set and matches current_period_end (or close), treat as cancel_at_period_end
  const cancelAt = sub.cancel_at;
  const periodEndTimestampNum = periodEndTimestamp;
  const isCancelingAtPeriodEnd = Boolean(sub.cancel_at_period_end) || 
    (cancelAt && periodEndTimestampNum && Math.abs(cancelAt - periodEndTimestampNum) < 86400); // Within 24 hours

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
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

  // Check if there's an existing subscription with the same (user_id, stripe_customer_id)
  // but different stripe_subscription_id (e.g., when upgrading from trial to paid)
  const { data: existingRecord } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  // If there's an existing record with a different subscription ID, delete it first
  if (existingRecord && existingRecord.stripe_subscription_id !== subscription.id) {
    console.log(`[Webhook] Deleting old subscription ${existingRecord.stripe_subscription_id} before syncing new one ${subscription.id}`);
    const { error: deleteError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('stripe_customer_id', customerId);
    
    if (deleteError) {
      console.error('Error deleting old subscription:', deleteError);
    }
  }

  // Upsert subscription - try both conflict resolution strategies
  let error = null;
  
  // First try: upsert on stripe_subscription_id (most common case)
  const { error: error1 } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
    });
  
  if (error1 && error1.code === '23505') {
    // If that fails due to unique constraint on (user_id, stripe_customer_id),
    // try updating the existing record instead
    console.log('[Webhook] First upsert failed, trying update on user_id + customer_id');
    const { error: error2 } = await supabaseAdmin
      .from('subscriptions')
      .update(subscriptionData)
      .eq('user_id', userId)
      .eq('stripe_customer_id', customerId);
    
    error = error2;
  } else {
    error = error1;
  }

  if (error) {
    console.error('Error syncing subscription to database:', error);
    throw error;
  }

  // Tag subscriber in ConvertKit if they have an active/trialing paid plan subscription
  // Only tag for 'learn' or 'accelerate' plans when status is 'active' or 'trialing'
  if ((status === 'active' || status === 'trialing') && (plan === 'learn' || plan === 'accelerate')) {
    try {
      // Get user email from auth.users
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (!userError && userData?.user?.email) {
        const PRODUCT_CAREERLYST_SUBSCRIBER_TAG_ID = 5458897;
        await tagSubscriber(PRODUCT_CAREERLYST_SUBSCRIBER_TAG_ID, userData.user.email);
        console.log(`[ConvertKit] Tagged ${userData.user.email} as ProductCareerlystSubscriber`);
      } else {
        console.warn(`[ConvertKit] Could not get user email for userId ${userId} to tag subscriber`);
      }
    } catch (tagError) {
      // Don't fail the webhook if tagging fails - log and continue
      console.error('[ConvertKit] Error tagging subscriber:', tagError);
    }
  }

  // Unpublish portfolio if user is no longer on Accelerate plan with active/trialing status
  // This ensures users who downgrade or cancel can't keep their public portfolio accessible
  await unpublishUserPortfolioIfNotAccelerate(supabaseAdmin, userId, plan, status);

  // Cancel trial sequence emails if user upgraded from trial to active
  if (isUpgradeFromTrial) {
    // Fire-and-forget: don't await, handle errors gracefully
    cancelTrialSequence(userId).catch((error) => {
      console.error('[Trial Email] Failed to cancel trial sequence:', error);
    });
  }
}

/**
 * Cancel trial sequence email flow for a user
 * Fire-and-forget implementation - errors are logged but don't block webhook processing
 */
async function cancelTrialSequence(userId: string): Promise<void> {
  try {
    // Get all flows and find the trial_sequence flow
    const flows = await getAllFlows();
    const trialSequenceFlow = flows.find((flow) => flow.name === 'trial_sequence');

    if (!trialSequenceFlow) {
      console.warn('[Trial Email] trial_sequence flow not found - skipping cancellation');
      return;
    }

    // Cancel the sequence (fire-and-forget - already handles background processing)
    const cancelledCount = await cancelSequence(undefined, userId, trialSequenceFlow.id);

    console.log(`[Trial Email] Successfully cancelled ${cancelledCount} emails in trial sequence for user ${userId}`);
  } catch (error) {
    // Log error but don't throw - this is fire-and-forget
    console.error('[Trial Email] Error cancelling trial sequence:', error);
    throw error; // Re-throw so caller can handle with .catch()
  }
}

