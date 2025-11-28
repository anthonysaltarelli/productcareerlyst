import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';
import Stripe from 'stripe';

// Type alias to avoid conflict with our Subscription interface
type StripeSubscription = Stripe.Subscription;

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
      // Get the subscription from Stripe to get price information
      const stripeSubscription: StripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      // If subscription is set to cancel at period end, there's no upcoming charge
      if (stripeSubscription.cancel_at_period_end) {
        return NextResponse.json({
          amount_due: 0,
          currency: null,
          period_start: null,
          period_end: null,
          subtotal: 0,
          total: 0,
          description: null,
        });
      }

      // Get price information from the subscription
      const price = stripeSubscription.items.data[0]?.price;
      if (!price || !price.unit_amount) {
        return NextResponse.json({
          amount_due: 0,
          currency: null,
          period_start: null,
          period_end: null,
          subtotal: 0,
          total: 0,
          description: null,
          discount: null,
        });
      }

      const amount = price.unit_amount;
      const currency = price.currency || 'usd';

      // Check for discounts on the subscription
      const sub = stripeSubscription as any;
      let discountInfo: { percentOff?: number; amountOff?: number; couponId?: string; couponName?: string } | null = null;
      
      // Get discount from subscription.discount (for single discount) or subscription.discounts (for multiple)
      const discount = sub.discount || (sub.discounts && sub.discounts[0]);
      if (discount && discount.coupon) {
        discountInfo = {
          percentOff: discount.coupon.percent_off || undefined,
          amountOff: discount.coupon.amount_off || undefined,
          couponId: discount.coupon.id,
          couponName: discount.coupon.name,
        };
      }

      // Calculate discounted amount
      let discountedAmount = amount;
      if (discountInfo) {
        if (discountInfo.percentOff) {
          discountedAmount = Math.round(amount * (1 - discountInfo.percentOff / 100));
        } else if (discountInfo.amountOff) {
          discountedAmount = Math.max(0, amount - discountInfo.amountOff);
        }
      }
      
      // Access current_period_end (sub already defined above for discount check)
      const currentPeriodEnd = sub.current_period_end;

      // Calculate next period end based on billing interval
      const interval = price.recurring?.interval || 'month';
      const intervalCount = price.recurring?.interval_count || 1;
      
      let nextPeriodEnd = currentPeriodEnd;
      const secondsInDay = 24 * 60 * 60;
      
      if (interval === 'month') {
        // Approximate: 30 days per month
        nextPeriodEnd = currentPeriodEnd + (intervalCount * 30 * secondsInDay);
      } else if (interval === 'year') {
        // Approximate: 365 days per year
        nextPeriodEnd = currentPeriodEnd + (intervalCount * 365 * secondsInDay);
      } else if (interval === 'day') {
        nextPeriodEnd = currentPeriodEnd + (intervalCount * secondsInDay);
      } else if (interval === 'week') {
        nextPeriodEnd = currentPeriodEnd + (intervalCount * 7 * secondsInDay);
      }

      // Get customer balance to account for credits
      // Customer balance: negative = credit, positive = debit
      let customerBalance = 0;
      try {
        const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
        customerBalance = (customer as any).balance || 0;
      } catch (balanceError) {
        console.log('Could not retrieve customer balance:', balanceError);
      }

      // Try to get the actual upcoming invoice - this accounts for customer balance/credits and discounts
      // Note: For subscriptions with billing_mode = flexible, we need to use createPreview instead of retrieveUpcoming
      try {
        const invoicesResource = stripe.invoices as any;
        
        // First try createPreview (works with flexible billing mode)
        if (invoicesResource && typeof invoicesResource.createPreview === 'function') {
          const previewInvoice = await invoicesResource.createPreview({
            customer: subscription.stripe_customer_id,
            subscription: subscription.stripe_subscription_id,
          });

          // Extract discount info from the preview invoice
          let invoiceDiscountInfo = discountInfo;
          if (previewInvoice.discount && previewInvoice.discount.coupon) {
            invoiceDiscountInfo = {
              percentOff: previewInvoice.discount.coupon.percent_off || undefined,
              amountOff: previewInvoice.discount.coupon.amount_off || undefined,
              couponId: previewInvoice.discount.coupon.id,
              couponName: previewInvoice.discount.coupon.name,
            };
          }

          return NextResponse.json({
            amount_due: previewInvoice.amount_due, // This accounts for credits/balance AND discounts
            currency: previewInvoice.currency,
            period_start: previewInvoice.period_start,
            period_end: previewInvoice.period_end,
            next_payment_date: previewInvoice.period_start || previewInvoice.period_end,
            subtotal: previewInvoice.subtotal,
            total: previewInvoice.total,
            description: previewInvoice.description || previewInvoice.lines?.data[0]?.description || null,
            discount: invoiceDiscountInfo,
          });
        }
        
        // Fallback: Try retrieveUpcoming (for non-flexible billing mode)
        if (invoicesResource && typeof invoicesResource.retrieveUpcoming === 'function') {
          const upcomingInvoice = await invoicesResource.retrieveUpcoming({
            customer: subscription.stripe_customer_id,
            subscription: subscription.stripe_subscription_id,
          });

          return NextResponse.json({
            amount_due: upcomingInvoice.amount_due,
            currency: upcomingInvoice.currency,
            period_start: upcomingInvoice.period_start,
            period_end: upcomingInvoice.period_end,
            next_payment_date: upcomingInvoice.period_start || upcomingInvoice.period_end,
            subtotal: upcomingInvoice.subtotal,
            total: upcomingInvoice.total,
            description: upcomingInvoice.description || upcomingInvoice.lines?.data[0]?.description || null,
            discount: discountInfo,
          });
        }
      } catch (invoiceError: any) {
        // If both methods fail, we'll calculate with customer balance and discounts
        console.log('Could not retrieve upcoming/preview invoice, calculating manually:', invoiceError.message);
      }

      // Fallback: Calculate amount_due accounting for customer balance/credits AND discounts
      // Customer balance is negative when they have credits, so we add it (subtract the negative)
      // Example: $48 subscription + (-$48 credit) = $0 due
      const actualAmountDue = Math.max(0, discountedAmount + customerBalance);

      // Fallback: use subscription price information with customer balance and discounts
      // The next payment is due when the current period ends
      return NextResponse.json({
        amount_due: actualAmountDue, // Accounts for customer credits AND discounts
        currency: currency,
        period_start: currentPeriodEnd, // When next billing period starts
        period_end: nextPeriodEnd, // When next billing period ends
        next_payment_date: currentPeriodEnd, // When the payment is actually due
        subtotal: amount,
        total: discountedAmount,
        description: price.nickname || `Subscription renewal - ${interval}`,
        discount: discountInfo,
      });
    } catch (error: any) {
      // If there's an error, return zero amount
      console.error('Error fetching upcoming invoice details:', error);
      return NextResponse.json({
        amount_due: 0,
        currency: null,
        period_start: null,
        period_end: null,
        subtotal: 0,
        total: 0,
        description: null,
      });
    }
  } catch (error) {
    console.error('Error fetching upcoming invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming invoice' },
      { status: 500 }
    );
  }
};

