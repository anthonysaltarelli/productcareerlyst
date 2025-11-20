'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, AlertCircle } from 'lucide-react';

export const BubbleTransferForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [stripeCustomerId, setStripeCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          stripeCustomerId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Transfer failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/billing');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-green-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Transfer Initiated!</h2>
          <p className="text-gray-600 font-semibold">
            We've received your transfer request. We'll verify your Bubble account and link your
            subscription. You'll receive an email confirmation shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
      <div className="mb-6 p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-900 mb-1">Transfer Your Subscription</h3>
            <p className="text-sm text-blue-800">
              If you have an active subscription on Bubble, provide your email and Stripe customer
              ID to link your account. We'll verify and transfer your subscription status.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
            Bubble Account Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-colors"
            placeholder="your.email@example.com"
          />
          <p className="mt-2 text-sm text-gray-600">
            The email address associated with your Bubble account
          </p>
        </div>

        <div>
          <label htmlFor="stripeCustomerId" className="block text-sm font-bold text-gray-900 mb-2">
            Stripe Customer ID (Optional)
          </label>
          <input
            id="stripeCustomerId"
            type="text"
            value={stripeCustomerId}
            onChange={(e) => setStripeCustomerId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-colors"
            placeholder="cus_xxxxxxxxxxxxx"
          />
          <p className="mt-2 text-sm text-gray-600">
            If you have your Stripe customer ID from Bubble, this will speed up the transfer
            process
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Submit Transfer Request'}
        </button>
      </form>

      <div className="mt-6 p-4 rounded-xl bg-gray-50">
        <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-sm text-gray-600">
          If you don't have your Stripe customer ID, that's okay! Just provide your email and
          we'll look up your account. You can find your Stripe customer ID in your Bubble account
          settings or by checking your email receipts from Stripe.
        </p>
      </div>
    </div>
  );
};

