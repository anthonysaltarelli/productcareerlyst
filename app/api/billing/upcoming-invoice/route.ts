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
      // OPTIMIZATION 1: Parallel fetch of subscription and customer
      const [stripeSubscription, customer] = await Promise.all([
        stripe.subscriptions.retrieve(subscription.stripe_subscription_id),
        stripe.customers.retrieve(subscription.stripe_customer_id).catch(() => null),
      ]);

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
      const now = Math.floor(Date.now() / 1000);

      // OPTIMIZATION 2: Check refund status with timeout (non-blocking if slow)
      // This is optional and won't block the main response
      let latestInvoiceRefunded = false;
      let periodEndAdjusted = false;
      let adjustedPeriodEnd = currentPeriodEnd;

      // Check refund status with timeout - don't wait more than 500ms
      if (stripeSubscription.latest_invoice) {
        try {
          const latestInvoiceId = typeof stripeSubscription.latest_invoice === 'string' 
            ? stripeSubscription.latest_invoice 
            : stripeSubscription.latest_invoice.id;
          
          // Use direct API for faster charge ID retrieval
          const stripeApiKey = process.env.STRIPE_SECRET_KEY;
          if (stripeApiKey) {
            const refundCheck = Promise.race([
              (async () => {
                const response = await fetch(`https://api.stripe.com/v1/invoices/${latestInvoiceId}`, {
                  headers: { 'Authorization': `Bearer ${stripeApiKey}` },
                });
                
                if (response.ok) {
                  const directInvoice: any = await response.json();
                  const chargeId = directInvoice.charge;
                  
                  if (chargeId && typeof chargeId === 'string') {
                    const charge = await stripe.charges.retrieve(chargeId);
                    return {
                      refunded: (charge.amount_refunded > 0) || (charge.refunded === true),
                      overdue: currentPeriodEnd < now,
                    };
                  }
                }
                return { refunded: false, overdue: false };
              })(),
              new Promise<{ refunded: boolean; overdue: boolean }>(resolve => 
                setTimeout(() => resolve({ refunded: false, overdue: false }), 500)
              ),
            ]);
            
            const refundResult = await refundCheck;
            if (refundResult.refunded) {
              latestInvoiceRefunded = true;
              if (refundResult.overdue) {
                periodEndAdjusted = true;
                adjustedPeriodEnd = now + (24 * 60 * 60);
              }
            }
          }
        } catch (error) {
          // Silently fail - refund check is not critical
        }
      }

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

      // Customer balance already retrieved in parallel above
      const customerBalance = (customer as any)?.balance || 0;

      // Check if subscription is canceled
      if (stripeSubscription.status === 'canceled') {
        return NextResponse.json({
          amount_due: 0,
          currency: null,
          period_start: null,
          period_end: null,
          subtotal: 0,
          total: 0,
          description: null,
          discount: null,
          no_upcoming_invoice: true,
          reason: 'subscription_canceled',
        });
      }

      // Check if subscription has no payment method and will cancel at trial end
      const hasPaymentMethod = Boolean(
        stripeSubscription.default_payment_method ||
        stripeSubscription.default_source ||
        (customer as any)?.invoice_settings?.default_payment_method ||
        (customer as any)?.default_source
      );

      // Check trial settings to see if it will cancel without payment method
      const trialSettings = (stripeSubscription as any).trial_settings;
      const willCancelWithoutPayment = trialSettings?.end_behavior?.missing_payment_method === 'cancel';
      const isTrialWithoutPayment = stripeSubscription.status === 'trialing' && !hasPaymentMethod && willCancelWithoutPayment;

      if (isTrialWithoutPayment) {
        return NextResponse.json({
          amount_due: 0,
          currency: null,
          period_start: null,
          period_end: null,
          subtotal: 0,
          total: 0,
          description: null,
          discount: null,
          no_upcoming_invoice: true,
          reason: 'trial_will_cancel_no_payment_method',
        });
      }

      // OPTIMIZATION 3: Try createPreview first (most accurate), skip retrieveUpcoming if it fails
      // This reduces sequential API calls
      try {
        const invoicesResource = stripe.invoices as any;
        
        if (invoicesResource?.createPreview) {
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

          // For flexible billing mode, createPreview returns:
          // - period_start: The old invoice creation date (NOT the next payment date!)
          // - period_end: The actual subscription renewal date (the correct next payment date)
          const previewPaymentDate = previewInvoice.period_end;
          const isPreviewOverdue = latestInvoiceRefunded && previewPaymentDate < now;
          
          return NextResponse.json({
            amount_due: previewInvoice.amount_due,
            currency: previewInvoice.currency,
            period_start: previewInvoice.period_start,
            period_end: previewInvoice.period_end,
            next_payment_date: isPreviewOverdue ? now : previewPaymentDate,
            subtotal: previewInvoice.subtotal,
            total: previewInvoice.total,
            description: previewInvoice.description || previewInvoice.lines?.data[0]?.description || null,
            discount: invoiceDiscountInfo,
            refunded: latestInvoiceRefunded,
            payment_overdue: isPreviewOverdue,
          });
        }
      } catch (previewError: any) {
        // Handle specific Stripe errors for trial without payment method and canceled subscriptions
        if (previewError?.code === 'invoice_upcoming_none') {
          const errorMessage = previewError?.message || '';
          
          if (errorMessage.includes('cancel at the end of the trial') || 
              errorMessage.includes('trial_settings') ||
              errorMessage.includes('missing_payment_method')) {
            return NextResponse.json({
              amount_due: 0,
              currency: null,
              period_start: null,
              period_end: null,
              subtotal: 0,
              total: 0,
              description: null,
              discount: null,
              no_upcoming_invoice: true,
              reason: 'trial_will_cancel_no_payment_method',
            });
          }
          
          if (errorMessage.includes('canceled subscription')) {
            return NextResponse.json({
              amount_due: 0,
              currency: null,
              period_start: null,
              period_end: null,
              subtotal: 0,
              total: 0,
              description: null,
              discount: null,
              no_upcoming_invoice: true,
              reason: 'subscription_canceled',
            });
          }
        }
        
        // Fall through to calculated fallback for other errors
        console.log('[Upcoming Invoice] Preview failed, using calculated fallback:', previewError?.message || previewError);
      }

      // Fallback: Calculate amount_due accounting for customer balance/credits AND discounts
      // Customer balance is negative when they have credits, so we add it (subtract the negative)
      // Example: $48 subscription + (-$48 credit) = $0 due
      const actualAmountDue = Math.max(0, discountedAmount + customerBalance);

      // Fallback: use subscription price information with customer balance and discounts
      // The next payment is due when the current period ends (or adjusted if refunded)
      const nextPaymentDate = periodEndAdjusted ? adjustedPeriodEnd : currentPeriodEnd;
      
      // If the period end is in the past and invoice was refunded, show payment due now
      const isPaymentOverdue = latestInvoiceRefunded && currentPeriodEnd < now;
      
      return NextResponse.json({
        amount_due: actualAmountDue, // Accounts for customer credits AND discounts
        currency: currency,
        period_start: periodEndAdjusted ? adjustedPeriodEnd : currentPeriodEnd, // When next billing period starts
        period_end: nextPeriodEnd, // When next billing period ends
        next_payment_date: isPaymentOverdue ? now : nextPaymentDate, // When the payment is actually due
        subtotal: amount,
        total: discountedAmount,
        description: price.nickname || `Subscription renewal - ${interval}`,
        discount: discountInfo,
        refunded: latestInvoiceRefunded, // Flag to indicate refund status
        payment_overdue: isPaymentOverdue, // Flag to indicate if payment is overdue
      });
    } catch (error: any) {
      // Handle specific Stripe errors
      if (error?.code === 'invoice_upcoming_none') {
        const errorMessage = error?.message || '';
        
        if (errorMessage.includes('cancel at the end of the trial') || 
            errorMessage.includes('trial_settings') ||
            errorMessage.includes('missing_payment_method')) {
          return NextResponse.json({
            amount_due: 0,
            currency: null,
            period_start: null,
            period_end: null,
            subtotal: 0,
            total: 0,
            description: null,
            discount: null,
            no_upcoming_invoice: true,
            reason: 'trial_will_cancel_no_payment_method',
          });
        }
        
        if (errorMessage.includes('canceled subscription')) {
          return NextResponse.json({
            amount_due: 0,
            currency: null,
            period_start: null,
            period_end: null,
            subtotal: 0,
            total: 0,
            description: null,
            discount: null,
            no_upcoming_invoice: true,
            reason: 'subscription_canceled',
          });
        }
      }
      
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
        discount: null,
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

