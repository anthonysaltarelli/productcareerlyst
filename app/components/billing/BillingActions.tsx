'use client';

import { useState } from 'react';
import { Subscription } from '@/lib/utils/subscription';
import { CreditCard, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PaymentMethodUpdate } from './PaymentMethodUpdate';

interface BillingActionsProps {
  subscription: Subscription | null;
}

interface CancelConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const CancelConfirmModal = ({ onConfirm, onCancel, loading }: CancelConfirmModalProps) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-gray-200 p-10 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-orange-100">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">Cancel Subscription</h2>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                Are you sure you want to cancel?
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Close"
            tabIndex={0}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6 mb-8">
          <div className="p-5 rounded-xl bg-yellow-50 border-2 border-yellow-200">
            <p className="text-yellow-800 font-semibold">
              You will continue to have access to all features until the end of your current billing period.
            </p>
          </div>
          <p className="text-gray-700 font-semibold">
            After your subscription ends, you'll lose access to premium features. You can reactivate at any time before the period ends.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-8 py-4 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            Keep Subscription
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold hover:from-red-700 hover:to-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl"
          >
            {loading ? 'Processing...' : 'Yes, Cancel Subscription'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const BillingActions = ({ subscription }: BillingActionsProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentUpdate, setShowPaymentUpdate] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ensure cancel_at_period_end is properly converted to boolean
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end as any;
  const willCancel = Boolean(
    cancelAtPeriodEnd === true || 
    cancelAtPeriodEnd === 'true' ||
    cancelAtPeriodEnd === 1
  );

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
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
      setShowCancelConfirm(false);
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

        <div className="flex gap-4">
          <button
            onClick={handlePaymentMethodUpdate}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-purple-200"
          >
            <CreditCard className="w-4 h-4" />
            Update Payment Method
          </button>

          {willCancel ? (
            <button
              onClick={handleReactivateSubscription}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-100 text-green-700 font-bold hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-green-200"
            >
              <RotateCcw className="w-4 h-4" />
              {loading ? 'Reactivating...' : 'Reactivate Subscription'}
            </button>
          ) : (
            <button
              onClick={handleCancelClick}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-200"
            >
              <X className="w-4 h-4" />
              Cancel Subscription
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

      {showCancelConfirm && (
        <CancelConfirmModal
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelConfirm(false)}
          loading={loading}
        />
      )}
    </>
  );
};

