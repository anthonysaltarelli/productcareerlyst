'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Check, ArrowLeft } from 'lucide-react';
import { TrackedButton } from '@/app/components/TrackedButton';
import { trackEvent } from '@/lib/amplitude/client';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface CheckoutFlowProps {
  plan: 'learn' | 'accelerate';
  billingCadence: 'monthly' | 'quarterly' | 'yearly';
}

export const CheckoutFlow = ({ plan, billingCadence }: CheckoutFlowProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planNames = {
    learn: 'Learn',
    accelerate: 'Accelerate',
  };

  const prices = {
    learn: {
      monthly: 12,
      quarterly: 27,
      yearly: 84,
    },
    accelerate: {
      monthly: 20,
      quarterly: 48,
      yearly: 144,
    },
  };

  const price = prices[plan][billingCadence];
  const monthlyEquivalent =
    billingCadence === 'monthly'
      ? price
      : billingCadence === 'quarterly'
        ? price / 3
        : price / 12;

  const handleCheckout = async () => {
    trackEvent('User Clicked Continue to Payment Button', {
      'Button Section': 'Checkout Summary Section',
      'Button Position': 'Bottom of checkout card',
      'Button Text': 'Continue to Payment',
      'Plan Selected': plan,
      'Billing Cadence': billingCadence,
      'Price': price,
      'Is Yearly Accelerate': emphasizeYearly,
    });

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          billingCadence,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        trackEvent('Checkout Error', {
          'Error Type': 'checkout_session_failed',
          'Error Message': data.error || 'Failed to create checkout session',
          'Plan Selected': plan,
          'Billing Cadence': billingCadence,
        });
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        const stripe = await stripePromise;
        if (!stripe) {
          trackEvent('Checkout Error', {
            'Error Type': 'stripe_error',
            'Error Message': 'Stripe failed to load',
            'Plan Selected': plan,
            'Billing Cadence': billingCadence,
          });
          throw new Error('Stripe failed to load');
        }

        const { error: stripeError } = await (stripe as any).redirectToCheckout({
          sessionId,
        });

        if (stripeError) {
          trackEvent('Checkout Error', {
            'Error Type': 'stripe_error',
            'Error Message': stripeError.message || 'Stripe checkout error',
            'Plan Selected': plan,
            'Billing Cadence': billingCadence,
          });
          throw stripeError;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const emphasizeYearly = billingCadence === 'yearly' && plan === 'accelerate';

  return (
    <div className="max-w-2xl mx-auto">
      <TrackedButton
        onClick={() => router.push('/dashboard/billing/plans')}
        buttonId="checkout-page-back-plans-button"
        eventName="User Clicked Back to Plans Button"
        eventProperties={{
          'Button Section': 'Page Header',
          'Button Position': 'Top left of page',
          'Button Text': 'Back to Plans',
          'Plan Selected': plan,
          'Billing Cadence': billingCadence,
        }}
        className="flex items-center gap-2 text-gray-700 font-semibold mb-6 hover:text-purple-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Plans
      </TrackedButton>

      <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8 md:p-12">
        {emphasizeYearly && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center">
            <div className="font-black text-xl mb-1">🎉 BEST VALUE!</div>
            <div className="font-semibold">
              You're getting the Accelerate plan at 40% off with yearly billing
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Complete Your Subscription
          </h1>
          <p className="text-gray-600 font-semibold">
            You're one step away from unlocking everything
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">
                {planNames[plan]} Plan ({billingCadence})
              </span>
              <span className="text-gray-900 font-bold">
                ${price}
                {billingCadence === 'monthly' && '/mo'}
                {billingCadence === 'quarterly' && '/3mo'}
                {billingCadence === 'yearly' && '/yr'}
              </span>
            </div>
            {billingCadence !== 'monthly' && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Monthly equivalent</span>
                <span className="text-gray-700 font-semibold">
                  ${monthlyEquivalent.toFixed(0)}/mo
                </span>
              </div>
            )}
            <div className="border-t-2 border-gray-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-bold text-lg">Total</span>
                <span className="text-purple-600 font-black text-xl">
                  ${price}
                  {billingCadence === 'monthly' && '/mo'}
                  {billingCadence === 'quarterly' && '/3mo'}
                  {billingCadence === 'yearly' && '/yr'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="mb-6">
          <h2 className="font-bold text-lg text-gray-900 mb-4">What's Included:</h2>
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
            {plan === 'learn' && (
              <>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    Limited access to tools and automations
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        <TrackedButton
          onClick={handleCheckout}
          buttonId="checkout-page-continue-payment-button"
          eventName="User Clicked Continue to Payment Button"
          eventProperties={{
            'Button Section': 'Checkout Summary Section',
            'Button Position': 'Bottom of checkout card',
            'Button Text': 'Continue to Payment',
            'Plan Selected': plan,
            'Billing Cadence': billingCadence,
            'Price': price,
            'Is Yearly Accelerate': emphasizeYearly,
          }}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Continue to Payment'}
        </TrackedButton>

        <p className="text-center text-sm text-gray-500 mt-4">
          Secure payment powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

