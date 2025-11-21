'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface PaymentMethodUpdateProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentForm = ({ onClose, onSuccess }: PaymentMethodUpdateProps) => {
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
          throw new Error(data.error || 'Failed to update payment method');
        }

        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
          <p className="text-red-700 font-semibold text-sm">{error}</p>
        </div>
      )}

      <div className="p-4 rounded-xl border-2 border-gray-200 bg-white">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Card Details
        </label>
        <CardElement options={cardElementOptions} />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !stripe || !clientSecret}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Update Payment Method'}
        </button>
      </div>
    </form>
  );
};

export const PaymentMethodUpdate = ({ onClose, onSuccess }: PaymentMethodUpdateProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-gray-200 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-black text-gray-900">Update Payment Method</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
            tabIndex={0}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm onClose={onClose} onSuccess={onSuccess} />
          </Elements>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading payment form...</p>
          </div>
        )}
      </div>
    </div>
  );
};

