import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';

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
    const { couponCode } = body;

    if (!couponCode || typeof couponCode !== 'string') {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();

    try {
      // Try to retrieve the coupon from Stripe
      const coupon = await stripe.coupons.retrieve(couponCode.trim());

      // Check if coupon is valid (not expired, still has redemptions left, etc.)
      if (!coupon.valid) {
        return NextResponse.json(
          { 
            valid: false, 
            error: 'This coupon has expired or is no longer valid' 
          },
          { status: 200 }
        );
      }

      // Check if coupon has reached max redemptions
      if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
        return NextResponse.json(
          { 
            valid: false, 
            error: 'This coupon has reached its maximum number of uses' 
          },
          { status: 200 }
        );
      }

      // Check if coupon has expired by date
      if (coupon.redeem_by && coupon.redeem_by < Math.floor(Date.now() / 1000)) {
        return NextResponse.json(
          { 
            valid: false, 
            error: 'This coupon has expired' 
          },
          { status: 200 }
        );
      }

      // Coupon is valid - return details
      return NextResponse.json({
        valid: true,
        coupon: {
          id: coupon.id,
          name: coupon.name,
          percentOff: coupon.percent_off,
          amountOff: coupon.amount_off,
          currency: coupon.currency,
          duration: coupon.duration,
          durationInMonths: coupon.duration_in_months,
        },
      });
    } catch (stripeError: any) {
      // Coupon not found or invalid
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json(
          { 
            valid: false, 
            error: 'Invalid coupon code' 
          },
          { status: 200 }
        );
      }
      throw stripeError;
    }
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
};

