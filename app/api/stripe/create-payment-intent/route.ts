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
    const { plan, billingCadence } = body;

    if (!plan || !billingCadence) {
      return NextResponse.json(
        { error: 'Plan and billing cadence are required' },
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
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
      
      // Save customer ID to database for future use (even without subscription)
      // This ensures both endpoints use the same customer
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          status: 'incomplete', // Temporary status until subscription is created
        }, {
          onConflict: 'user_id',
        });
    }

    // Create a Setup Intent for collecting payment method
    // This will be used with Payment Element
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        user_id: user.id,
        plan,
        billing_cadence: billingCadence,
      },
    });

    return NextResponse.json({ 
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
};

