import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';

export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Stripe customer ID and subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const stripe = getStripeClient();

    try {
      // Fetch subscription and customer in parallel
      const [stripeSubscription, customer] = await Promise.all([
        stripe.subscriptions.retrieve(subscription.stripe_subscription_id),
        stripe.customers.retrieve(subscription.stripe_customer_id),
      ]);

      // Check if subscription has a default payment method
      const hasSubscriptionPaymentMethod = Boolean(
        stripeSubscription.default_payment_method ||
        stripeSubscription.default_source
      );

      // Check if customer has a default payment method
      const hasCustomerPaymentMethod = Boolean(
        (customer as any).invoice_settings?.default_payment_method ||
        (customer as any).default_source
      );

      // Also check if customer has any payment methods attached
      const paymentMethods = await stripe.paymentMethods.list({
        customer: subscription.stripe_customer_id,
        limit: 1,
      });

      const hasPaymentMethod = hasSubscriptionPaymentMethod || 
                                hasCustomerPaymentMethod || 
                                paymentMethods.data.length > 0;

      return NextResponse.json({
        hasPaymentMethod,
        subscriptionHasPaymentMethod: hasSubscriptionPaymentMethod,
        customerHasPaymentMethod: hasCustomerPaymentMethod,
      });
    } catch (error: any) {
      console.error('Error checking payment method status:', error);
      // If we can't check, assume no payment method for safety
      return NextResponse.json({
        hasPaymentMethod: false,
        subscriptionHasPaymentMethod: false,
        customerHasPaymentMethod: false,
      });
    }
  } catch (error) {
    console.error('Error fetching payment method status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment method status' },
      { status: 500 }
    );
  }
};

