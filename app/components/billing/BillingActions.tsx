'use client';

import { useState } from 'react';
import { Subscription } from '@/lib/utils/subscription';
import { CreditCard, X, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PaymentMethodUpdate } from './PaymentMethodUpdate';

interface BillingActionsProps {
  subscription: Subscription | null;
}

export const BillingActions = ({ subscription }: BillingActionsProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentUpdate, setShowPaymentUpdate] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ensure cancel_at_period_end is properly converted to boolean
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end as any;
  const willCancel = Boolean(
    cancelAtPeriodEnd === true || 
    cancelAtPeriodEnd === 'true' ||
    cancelAtPeriodEnd === 1
  );

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancel: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      setSuccessMessage('Your subscription will be canceled at the end of the current billing period.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancel: false }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reactivate subscription');
      }

      setSuccessMessage('Your subscription has been reactivated!');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handlePaymentMethodUpdate = () => {
    setShowPaymentUpdate(true);
  };

  const handlePaymentUpdateSuccess = () => {
    setSuccessMessage('Payment method updated successfully!');
    router.refresh();
  };

  if (!subscription) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Manage Subscription</h2>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border-2 border-green-200">
            <p className="text-green-700 font-semibold">{successMessage}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handlePaymentMethodUpdate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-5 h-5" />
            Update Payment Method
          </button>

          {willCancel ? (
            <button
              onClick={handleReactivateSubscription}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-5 h-5" />
              {loading ? 'Reactivating...' : 'Reactivate Subscription'}
            </button>
          ) : (
            <button
              onClick={handleCancelSubscription}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold hover:from-red-700 hover:to-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
              {loading ? 'Processing...' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      </div>

      {showPaymentUpdate && (
        <PaymentMethodUpdate
          onClose={() => setShowPaymentUpdate(false)}
          onSuccess={handlePaymentUpdateSuccess}
        />
      )}
    </>
  );
};

