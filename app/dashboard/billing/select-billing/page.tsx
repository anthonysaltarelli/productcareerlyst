'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

const plans = {
  learn: {
    name: 'Learn',
    monthly: { price: 12 },
    quarterly: { price: 27, savings: '25%' },
    yearly: { price: 84, savings: '42%' },
  },
  accelerate: {
    name: 'Accelerate',
    monthly: { price: 20 },
    quarterly: { price: 48, savings: '20%' },
    yearly: { price: 144, savings: '40%' },
  },
};

const billingLabels = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const PaymentFormContent = ({ 
  plan, 
  billingCadence, 
  onSuccess,
  clientSecret
}: { 
  plan: 'learn' | 'accelerate';
  billingCadence: 'monthly' | 'quarterly' | 'yearly';
  onSuccess: () => void;
  clientSecret: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Submit payment method
      const { error: submitError } = await elements.submit();

      if (submitError) {
        setError(submitError.message || 'Payment submission failed');
        setLoading(false);
        return;
      }

      // Confirm the setup intent to get the payment method
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment confirmation failed');
        setLoading(false);
        return;
      }

      if (!setupIntent || !setupIntent.payment_method) {
        setError('No payment method returned');
        setLoading(false);
        return;
      }

      const paymentMethodId = typeof setupIntent.payment_method === 'string' 
        ? setupIntent.payment_method 
        : setupIntent.payment_method.id;

      // Create subscription with payment method
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          billingCadence,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Success - subscription created
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          'Complete Subscription'
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Secure payment powered by Stripe. Cancel anytime.
      </p>
    </form>
  );
};

export default function SelectBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingClientSecret, setLoadingClientSecret] = useState(false);

  const plan = searchParams.get('plan') as 'learn' | 'accelerate' | null;

  useEffect(() => {
    if (!plan) {
      router.push('/dashboard/billing');
      return;
    }
  }, [plan, router]);

  if (!plan) {
    return null;
  }

  const planData = plans[plan];
  const price = planData[selectedBilling].price;
  const monthlyEquivalent =
    selectedBilling === 'monthly'
      ? price
      : selectedBilling === 'quarterly'
        ? price / 3
        : price / 12;

  const handleContinue = async () => {
    setShowPaymentForm(true);
    setLoadingClientSecret(true);
    
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan!,
          billingCadence: selectedBilling,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create payment intent');
      }

      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      // Still show form, error will be handled in CheckoutForm
    } finally {
      setLoadingClientSecret(false);
    }
  };

  const handleSuccess = async () => {
    setIsProcessing(true);
    // Wait a moment for webhook to process, then redirect
    // The SuccessHandler component will also sync as a backup
    setTimeout(() => {
      router.push('/dashboard/billing?success=true');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-700 font-semibold mb-8 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4">
            {showPaymentForm ? 'Complete Your Subscription' : 'Choose Your Billing Cycle'}
          </h1>
          <p className="text-lg text-gray-700 font-semibold">
            {showPaymentForm 
              ? `Enter your payment details to start your ${planData.name} plan`
              : `Select how you'd like to be billed for the ${planData.name} plan`
            }
          </p>
        </div>

        {!showPaymentForm ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {(['monthly', 'quarterly', 'yearly'] as const).map((billing) => {
                const billingData = planData[billing];
                const isSelected = selectedBilling === billing;
                const monthlyEquivalent =
                  billing === 'monthly'
                    ? billingData.price
                    : billing === 'quarterly'
                      ? billingData.price / 3
                      : billingData.price / 12;

                const isYearly = billing === 'yearly';

                return (
                  <button
                    key={billing}
                    onClick={() => setSelectedBilling(billing)}
                    className={`relative p-8 rounded-[2.5rem] border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-white ring-4 ring-purple-200 shadow-xl'
                        : 'border-gray-200 bg-white hover:border-purple-300 shadow-lg'
                    } ${isYearly ? 'ring-2 ring-purple-300' : ''}`}
                  >
                    {'savings' in billingData && billingData.savings && (
                      <div className="absolute -top-3 -right-3 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg">
                        {billingData.savings} OFF
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-black text-2xl text-gray-900">
                        {billingLabels[billing]}
                      </div>
                      {isSelected && (
                        <div className="p-2 rounded-full bg-purple-600">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-4xl font-black text-purple-600">
                        ${billingData.price}
                        {billing === 'monthly' && '/mo'}
                        {billing === 'quarterly' && '/3mo'}
                        {billing === 'yearly' && '/yr'}
                      </div>
                      {billing !== 'monthly' && (
                        <div className="text-lg text-gray-600 font-semibold">
                          ${monthlyEquivalent.toFixed(0)}/mo
                        </div>
                      )}
                      {billing === 'yearly' && (
                        <div className="pt-2 text-sm text-green-600 font-bold">
                          Best Value - Save {plan === 'learn' ? '42' : '40'}% annually
                        </div>
                      )}
                    </div>
                    {isYearly && (
                      <div className="mt-4 pt-4 border-t-2 border-gray-200">
                        <div className="flex justify-center">
                          <span className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold">
                            MOST POPULAR
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleContinue}
                className="px-12 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Continue to Payment
              </button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b-2 border-gray-200">
                  <span className="text-gray-700 font-semibold">
                    {planData.name} Plan ({billingLabels[selectedBilling]})
                  </span>
                  <span className="text-gray-900 font-bold text-lg">
                    ${price}
                    {selectedBilling === 'monthly' && '/mo'}
                    {selectedBilling === 'quarterly' && '/3mo'}
                    {selectedBilling === 'yearly' && '/yr'}
                  </span>
                </div>
                {selectedBilling !== 'monthly' && (
                  <div className="flex justify-between items-center text-sm pb-4 border-b-2 border-gray-200">
                    <span className="text-gray-600">Monthly equivalent</span>
                    <span className="text-gray-700 font-semibold">
                      ${monthlyEquivalent.toFixed(0)}/mo
                    </span>
                  </div>
                )}
                <div className="pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-bold text-xl">Total</span>
                    <span className="text-purple-600 font-black text-2xl">
                      ${price}
                      {selectedBilling === 'monthly' && '/mo'}
                      {selectedBilling === 'quarterly' && '/3mo'}
                      {selectedBilling === 'yearly' && '/yr'}
                    </span>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="mt-8 pt-8 border-t-2 border-gray-200">
                <h3 className="font-bold text-lg text-gray-900 mb-4">What's Included:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">All Course Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">All Resources</span>
                  </div>
                  {plan === 'accelerate' && (
                    <>
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">Product Portfolio Template</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 font-bold">Unlimited Everything</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                  <p className="text-lg font-semibold text-gray-700">Processing your subscription...</p>
                  <p className="text-sm text-gray-500 mt-2">This will just take a moment</p>
                </div>
              ) : loadingClientSecret || !clientSecret ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                  <p className="text-lg font-semibold text-gray-700">Loading payment form...</p>
                </div>
              ) : (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#9333ea',
                        colorBackground: '#ffffff',
                        colorText: '#1f2937',
                        colorDanger: '#ef4444',
                        fontFamily: 'system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '12px',
                      },
                    },
                  }}
                >
                  <PaymentFormContent 
                    plan={plan} 
                    billingCadence={selectedBilling} 
                    onSuccess={handleSuccess}
                    clientSecret={clientSecret}
                  />
                </Elements>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
