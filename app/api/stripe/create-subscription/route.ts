import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient, STRIPE_PRICE_IDS } from '@/lib/stripe/client';

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

    const body = await request.json();
    const { plan, billingCadence, paymentMethodId } = body;

    if (!plan || !billingCadence || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Plan, billing cadence, and payment method are required' },
        { status: 400 }
      );
    }

    if (plan !== 'learn' && plan !== 'accelerate') {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    if (!['monthly', 'quarterly', 'yearly'].includes(billingCadence)) {
      return NextResponse.json(
        { error: 'Invalid billing cadence' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const priceId = STRIPE_PRICE_IDS[plan as 'learn' | 'accelerate'][billingCadence as 'monthly' | 'quarterly' | 'yearly'];

    // Check if user already has a Stripe customer ID
    let customerId: string;
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;
    } else {
      // Check if customer was created in create-payment-intent but not yet saved
      // Try to find customer by email in Stripe
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Save to database for future use
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            status: 'incomplete',
          }, {
            onConflict: 'user_id',
          });
      } else {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
          },
        });
        customerId = customer.id;
        // Save to database
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            status: 'incomplete',
          }, {
            onConflict: 'user_id',
          });
      }
    }

    // Check if payment method is already attached to the correct customer
    // The setup intent should have already attached it, but we verify here
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (!paymentMethod.customer) {
        // Not attached to any customer, attach it
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
      } else if (paymentMethod.customer !== customerId) {
        // Attached to a different customer - this shouldn't happen with our flow
        // but if it does, we can't reuse the payment method
        return NextResponse.json(
          { error: 'Payment method is associated with a different account. Please use a different card.' },
          { status: 400 }
        );
      }
      // If already attached to this customer, no action needed
    } catch (attachError: any) {
      // Handle specific Stripe errors
      if (attachError.code === 'resource_already_exists' || 
          attachError.message?.includes('already been attached')) {
        // Payment method is already attached, continue
      } else if (attachError.message?.includes('previously used') || 
                 attachError.message?.includes('may not be used again')) {
        // Payment method was detached and can't be reused
        return NextResponse.json(
          { error: 'This payment method cannot be reused. Please enter a new card.' },
          { status: 400 }
        );
      } else {
        throw attachError;
      }
    }

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription with payment method
    // Using default_payment_method ensures immediate payment
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      default_payment_method: paymentMethodId,
      metadata: {
        user_id: user.id,
        plan,
        billing_cadence: billingCadence,
      },
    });

    return NextResponse.json({ 
      success: true,
      subscriptionId: subscription.id,
      customerId,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: error.message || 'Card payment failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
};

