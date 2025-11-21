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
      // Get the subscription from Stripe to get price information
      const stripeSubscription = await stripe.subscriptions.retrieve(
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
        });
      }

      const amount = price.unit_amount;
      const currency = price.currency || 'usd';
      const currentPeriodEnd = stripeSubscription.current_period_end;

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

      // Try to get the actual upcoming invoice - this accounts for customer balance/credits
      try {
        const invoicesResource = stripe.invoices as any;
        
        // Try retrieveUpcoming if available
        if (invoicesResource && typeof invoicesResource.retrieveUpcoming === 'function') {
          const upcomingInvoice = await invoicesResource.retrieveUpcoming({
            customer: subscription.stripe_customer_id,
            subscription: subscription.stripe_subscription_id,
          });

          return NextResponse.json({
            amount_due: upcomingInvoice.amount_due, // This accounts for credits/balance
            currency: upcomingInvoice.currency,
            period_start: upcomingInvoice.period_start,
            period_end: upcomingInvoice.period_end,
            next_payment_date: upcomingInvoice.period_start || upcomingInvoice.period_end,
            subtotal: upcomingInvoice.subtotal,
            total: upcomingInvoice.total,
            description: upcomingInvoice.description || upcomingInvoice.lines.data[0]?.description || null,
          });
        }
      } catch (invoiceError: any) {
        // If retrieveUpcoming fails, we'll calculate with customer balance
        console.log('Could not retrieve upcoming invoice, calculating with customer balance:', invoiceError.message);
      }

      // Fallback: Calculate amount_due accounting for customer balance/credits
      // Customer balance is negative when they have credits, so we add it (subtract the negative)
      // Example: $48 subscription + (-$48 credit) = $0 due
      const actualAmountDue = Math.max(0, amount + customerBalance);

      // Fallback: use subscription price information with customer balance
      // The next payment is due when the current period ends
      return NextResponse.json({
        amount_due: actualAmountDue, // Accounts for customer credits
        currency: currency,
        period_start: currentPeriodEnd, // When next billing period starts
        period_end: nextPeriodEnd, // When next billing period ends
        next_payment_date: currentPeriodEnd, // When the payment is actually due
        subtotal: amount,
        total: amount,
        description: price.nickname || `Subscription renewal - ${interval}`,
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

