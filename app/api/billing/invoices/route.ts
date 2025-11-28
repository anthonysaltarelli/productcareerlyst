import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';
import Stripe from 'stripe';

/**
 * Get charge ID from invoice using SDK or direct API fallback
 * The Stripe SDK sometimes doesn't return charge/payment_intent, so we fall back to direct API
 */
const getInvoiceChargeId = async (invoiceId: string, stripe: Stripe): Promise<string | null> => {
  try {
    // Try SDK first
    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ['charge', 'payment_intent'],
    });
    
    const invoiceAny = invoice as any;
    const chargeId = typeof invoiceAny.charge === 'string' 
      ? invoiceAny.charge 
      : invoiceAny.charge?.id;
    
    if (chargeId) return chargeId;
    
    // If SDK didn't return charge, try direct API
    const stripeApiKey = process.env.STRIPE_SECRET_KEY;
    if (stripeApiKey) {
      const response = await fetch(`https://api.stripe.com/v1/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${stripeApiKey}` },
      });
      
      if (response.ok) {
        const directInvoice: any = await response.json();
        return directInvoice.charge || null;
      }
    }
  } catch (error) {
    console.error(`[Invoices API] Error getting charge ID for invoice ${invoiceId}:`, error);
  }
  
  return null;
};

/**
 * Get charge and refund information
 */
const getChargeRefundInfo = async (chargeId: string, stripe: Stripe) => {
  try {
    const charge = await stripe.charges.retrieve(chargeId);
    const amount_refunded = charge.amount_refunded || 0;
    const refunded = (amount_refunded > 0) || (charge.refunded === true);
    
    let refunds: any[] = [];
    if (amount_refunded > 0) {
      try {
        const refundsList = await stripe.refunds.list({ 
          charge: chargeId, 
          limit: 100 
        });
        refunds = refundsList.data;
      } catch (err) {
        console.error(`[Invoices API] Error fetching refunds for charge ${chargeId}:`, err);
      }
    }
    
    return { amount_refunded, refunded, refunds };
  } catch (error) {
    console.error(`[Invoices API] Error retrieving charge ${chargeId}:`, error);
    return null;
  }
};

/**
 * Get charge ID from payment intent
 */
const getChargeIdFromPaymentIntent = async (paymentIntentId: string, stripe: Stripe): Promise<string | null> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges.data'],
    });
    
    const piAny = paymentIntent as any;
    if (piAny.charges?.data && Array.isArray(piAny.charges.data) && piAny.charges.data.length > 0) {
      return piAny.charges.data[0].id;
    }
  } catch (error) {
    console.error(`[Invoices API] Error retrieving payment intent ${paymentIntentId}:`, error);
  }
  
  return null;
};

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

    // Get user's Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    const stripe = getStripeClient();

    // Get invoices for the customer
    const invoices = await stripe.invoices.list({
      customer: subscription.stripe_customer_id,
      limit: 100,
    });

    // Format invoices for the frontend, including refund information
    const formattedInvoices = await Promise.all(
      invoices.data.map(async (invoice) => {
        let amount_refunded = 0;
        let refunded = false;
        let refunds: any[] = [];

        // Get charge ID (tries SDK first, falls back to direct API)
        const chargeId = await getInvoiceChargeId(invoice.id, stripe);
        
        if (chargeId) {
          const refundInfo = await getChargeRefundInfo(chargeId, stripe);
          if (refundInfo) {
            amount_refunded = refundInfo.amount_refunded;
            refunded = refundInfo.refunded;
            refunds = refundInfo.refunds;
          }
        } else {
          // If no charge found, try payment intent as fallback
          try {
            const invoiceData = await stripe.invoices.retrieve(invoice.id);
            const invoiceAny = invoiceData as any;
            const paymentIntentId = invoiceAny.payment_intent;
            
            if (paymentIntentId) {
              const piChargeId = await getChargeIdFromPaymentIntent(
                typeof paymentIntentId === 'string' ? paymentIntentId : paymentIntentId.id,
                stripe
              );
              
              if (piChargeId) {
                const refundInfo = await getChargeRefundInfo(piChargeId, stripe);
                if (refundInfo) {
                  amount_refunded = refundInfo.amount_refunded;
                  refunded = refundInfo.refunded;
                  refunds = refundInfo.refunds;
                }
              }
            }
          } catch (error) {
            console.error(`[Invoices API] Error checking payment intent for invoice ${invoice.id}:`, error);
          }
        }

        return {
          id: invoice.id,
          number: invoice.number,
          amount_paid: invoice.amount_paid,
          amount_due: invoice.amount_due,
          amount_refunded,
          refunded,
          refunds: refunds.map((refund) => ({
            id: refund.id,
            amount: refund.amount,
            status: refund.status,
            created: refund.created,
            reason: refund.reason,
          })),
          currency: invoice.currency,
          status: invoice.status,
          created: invoice.created,
          due_date: invoice.due_date,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          description: invoice.description || invoice.lines.data[0]?.description || 'Subscription invoice',
        };
      })
    );

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
};

