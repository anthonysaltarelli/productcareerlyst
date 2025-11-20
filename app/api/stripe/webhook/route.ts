import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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

export const POST = async (request: NextRequest) => {
  const stripe = getStripeClient();
  const body = await request.text();
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
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
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

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating subscription to past_due:', error);
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

  // Get plan and billing cadence from metadata or price
  let plan: 'learn' | 'accelerate' = 'learn';
  let billingCadence: 'monthly' | 'quarterly' | 'yearly' = 'monthly';

  if (metadata.plan) {
    plan = metadata.plan as 'learn' | 'accelerate';
  }
  if (metadata.billing_cadence) {
    billingCadence = metadata.billing_cadence as 'monthly' | 'quarterly' | 'yearly';
  } else {
    // Infer from price interval
    const price = subscription.items.data[0]?.price;
    if (price) {
      if (price.recurring?.interval === 'month') {
        billingCadence = 'monthly';
      } else if (price.recurring?.interval === 'year') {
        billingCadence = 'yearly';
      }
    }
  }

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

  // Upsert subscription
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('Error syncing subscription to database:', error);
    throw error;
  }
}

