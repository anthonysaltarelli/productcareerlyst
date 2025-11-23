'use client';

import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard } from 'lucide-react';
import { TrackedButton } from '@/app/components/TrackedButton';
import { trackEvent } from '@/lib/amplitude/client';
import { Subscription } from '@/lib/utils/subscription';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface PaymentMethodUpdateProps {
  onClose: () => void;
  onSuccess: () => void;
  subscription?: Subscription | null;
}

const PaymentForm = ({ onClose, onSuccess, subscription }: PaymentMethodUpdateProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    const createSetupIntent = async () => {
      try {
        const response = await fetch('/api/billing/create-setup-intent', {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create setup intent');
        }

        const { client_secret } = await response.json();
        setClientSecret(client_secret);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    createSetupIntent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Stripe not loaded');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      return;
    }

    // Track form submission
    trackEvent('User Clicked Update Payment Method Button', {
      'Button Section': 'Payment Method Update Modal',
      'Button Position': 'Bottom right of modal',
      'Button Text': 'Update Payment Method',
      'Form Validation Status': 'valid',
      'Payment Method Type': 'card',
      'Current Plan': subscription?.plan || null,
    });

    setLoading(true);
    setError(null);

    try {
      // Confirm the setup intent with the card element
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        trackEvent('Payment Method Update Error', {
          'Error Type': 'setup_intent_failed',
          'Error Message': confirmError.message,
          'Current Plan': subscription?.plan || null,
        });
        throw new Error(confirmError.message);
      }

      if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
        // Update the payment method
        const updateResponse = await fetch('/api/billing/update-payment-method', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethodId: setupIntent.payment_method,
          }),
        });

        if (!updateResponse.ok) {
          const data = await updateResponse.json();
          trackEvent('Payment Method Update Error', {
            'Error Type': 'payment_method_update_failed',
            'Error Message': data.error || 'Failed to update payment method',
            'Current Plan': subscription?.plan || null,
          });
          throw new Error(data.error || 'Failed to update payment method');
        }

        // Track success
        const paymentMethodId = typeof setupIntent.payment_method === 'string' 
          ? setupIntent.payment_method 
          : setupIntent.payment_method.id;

        trackEvent('Payment Method Updated Successfully', {
          'Payment Method ID': paymentMethodId,
          'Setup Intent Status': setupIntent.status,
          'Current Plan': subscription?.plan || null,
          'Subscription Status': subscription?.status || null,
        });

        onSuccess();
        onClose();
      }
    } catch (err) {
      trackEvent('Payment Method Update Error', {
        'Error Type': 'stripe_error',
        'Error Message': err instanceof Error ? err.message : 'An error occurred',
        'Current Plan': subscription?.plan || null,
      });
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '18px',
        color: '#1f2937',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#dc2626',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-5 rounded-xl bg-red-50 border-2 border-red-200">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-base font-bold text-gray-900">
          Card Details
        </label>
        <div className="p-6 rounded-xl border-2 border-gray-300 bg-white focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition-all">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-sm text-gray-500">
          Your payment information is secure and encrypted
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-8 py-4 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !stripe || !clientSecret}
          className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl"
        >
          {loading ? 'Processing...' : 'Update Payment Method'}
        </button>
      </div>
    </form>
  );
};

export const PaymentMethodUpdate = ({ onClose, onSuccess, subscription }: PaymentMethodUpdateProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const modalTracked = useRef(false);

  // Track modal view
  useEffect(() => {
    if (modalTracked.current) return;
    modalTracked.current = true;

    trackEvent('User Viewed Payment Method Update Modal', {
      'Modal Type': 'payment_method_update',
      'Current Plan': subscription?.plan || null,
      'Subscription Status': subscription?.status || null,
      'Has Past Due': subscription?.status === 'past_due',
    });
  }, [subscription]);

  useEffect(() => {
    const createSetupIntent = async () => {
      try {
        const response = await fetch('/api/billing/create-setup-intent', {
          method: 'POST',
        });

        if (!response.ok) {
          return;
        }

        const { client_secret } = await response.json();
        setClientSecret(client_secret);
      } catch (err) {
        // Error handled in PaymentForm
      }
    };

    createSetupIntent();
  }, []);

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-gray-200 p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">
              <CreditCard className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">Update Payment Method</h2>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                Add a new payment method to your account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
            tabIndex={0}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm onClose={onClose} onSuccess={onSuccess} subscription={subscription} />
          </Elements>
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading payment form...</p>
          </div>
        )}
      </div>
    </div>
  );
};

