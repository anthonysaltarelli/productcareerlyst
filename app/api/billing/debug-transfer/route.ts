import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { getUserSubscription } from '@/lib/utils/subscription';

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

export const GET = async (request: NextRequest) => {
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

    // Determine Stripe mode from secret key
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    let stripeMode: 'test' | 'live' | 'unknown' = 'unknown';
    if (secretKey.startsWith('sk_test_')) {
      stripeMode = 'test';
    } else if (secretKey.startsWith('sk_live_')) {
      stripeMode = 'live';
    }

    // Check bubble_users table
    const { data: bubbleUser, error: bubbleError } = await supabaseAdmin
      .from('bubble_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    const bubbleUserInfo = {
      found: !!bubbleUser && !bubbleError,
      id: bubbleUser?.id,
      email: bubbleUser?.email,
      stripe_customer_id: bubbleUser?.stripe_customer_id,
      matched_user_id: bubbleUser?.matched_user_id,
      matched_at: bubbleUser?.matched_at,
      current_plan: bubbleUser?.current_plan,
      subscription_status: bubbleUser?.subscription_status,
    };

    // Try to fetch Stripe customer if we have a customer ID
    let stripeCustomerInfo = {
      found: false,
      id: undefined as string | undefined,
      email: undefined as string | undefined,
      mode: undefined as string | undefined,
      error: undefined as string | undefined,
    };

    if (bubbleUser?.stripe_customer_id) {
      try {
        const stripe = getStripeClient();
        const customer = await stripe.customers.retrieve(bubbleUser.stripe_customer_id);
        
        if (customer && !customer.deleted) {
          stripeCustomerInfo = {
            found: true,
            id: customer.id,
            email: typeof customer.email === 'string' ? customer.email : undefined,
            mode: customer.livemode ? 'live' : 'test',
          };
        }
      } catch (stripeError: any) {
        stripeCustomerInfo.error = stripeError.message || 'Unknown error';
      }
    }

    // Get subscription from database
    const subscription = await getUserSubscription(user.id);

    const subscriptionInfo = {
      found: !!subscription,
      id: subscription?.stripe_subscription_id,
      status: subscription?.status,
      plan: subscription?.plan,
      transferred_from_bubble: subscription?.transferred_from_bubble || false,
    };

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      stripeMode,
      bubbleUser: bubbleUserInfo,
      stripeCustomer: stripeCustomerInfo,
      subscription: subscriptionInfo,
    });
  } catch (error) {
    console.error('Error fetching debug info:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch debug info' },
      { status: 500 }
    );
  }
};

