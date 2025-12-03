'use client';

import { useState, useEffect } from 'react';
import { CreditCard, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PaymentMethodUpdate } from './PaymentMethodUpdate';
import { TrackedButton } from '@/app/components/TrackedButton';
import { trackEvent } from '@/lib/amplitude/client';
import { getUserStateContextFromSubscription, Subscription } from '@/lib/utils/billing-tracking-client';

interface BillingActionsProps {
  subscription: Subscription | null;
}

interface CancelConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  subscription: Subscription;
}

const CancelConfirmModal = ({ onConfirm, onCancel, loading, subscription }: CancelConfirmModalProps) => {
  const userState = getUserStateContextFromSubscription(subscription, null);
  
  const handleKeepSubscription = () => {
    trackEvent('User Clicked Keep Subscription Button', {
      'Button Section': 'Cancel Confirmation Modal',
      'Button Position': 'Left side of modal buttons',
      'Button Text': 'Keep Subscription',
      'Current Plan': subscription.plan,
      'Current Billing Cadence': subscription.billing_cadence,
      'Days Until Period End': userState.daysUntilPeriodEnd,
      'Modal Shown': true,
    });
    onCancel();
  };

  const handleConfirmCancel = () => {
    trackEvent('User Clicked Confirm Cancel Subscription Button', {
      'Button Section': 'Cancel Confirmation Modal',
      'Button Position': 'Right side of modal buttons',
      'Button Text': 'Yes, Cancel Subscription',
      'Current Plan': subscription.plan,
      'Current Billing Cadence': subscription.billing_cadence,
      'Days Since Subscription Start': userState.daysSinceSubscriptionStart,
      'Days Until Period End': userState.daysUntilPeriodEnd,
      'Has Used Feature': false, // Would need to fetch this separately
      'Feature Usage Count': 0, // Would need to fetch this separately
    });
    onConfirm();
  };

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
          <TrackedButton
            type="button"
            onClick={handleKeepSubscription}
            buttonId="cancel-modal-keep-subscription-button"
            eventName="User Clicked Keep Subscription Button"
            eventProperties={{
              'Button Section': 'Cancel Confirmation Modal',
              'Button Position': 'Left side of modal buttons',
              'Button Text': 'Keep Subscription',
              'Current Plan': subscription.plan,
              'Current Billing Cadence': subscription.billing_cadence,
              'Days Until Period End': userState.daysUntilPeriodEnd,
              'Modal Shown': true,
            }}
            disabled={loading}
            className="flex-1 px-8 py-4 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            Keep Subscription
          </TrackedButton>
          <TrackedButton
            type="button"
            onClick={handleConfirmCancel}
            buttonId="cancel-modal-confirm-cancel-button"
            eventName="User Clicked Confirm Cancel Subscription Button"
            eventProperties={{
              'Button Section': 'Cancel Confirmation Modal',
              'Button Position': 'Right side of modal buttons',
              'Button Text': 'Yes, Cancel Subscription',
              'Current Plan': subscription.plan,
              'Current Billing Cadence': subscription.billing_cadence,
              'Days Since Subscription Start': userState.daysSinceSubscriptionStart,
              'Days Until Period End': userState.daysUntilPeriodEnd,
              'Has Used Feature': false,
              'Feature Usage Count': 0,
            }}
            disabled={loading}
            className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold hover:from-red-700 hover:to-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl"
          >
            {loading ? 'Processing...' : 'Yes, Cancel Subscription'}
          </TrackedButton>
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
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);

  // Ensure cancel_at_period_end is properly converted to boolean
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end as any;
  const willCancel = Boolean(
    cancelAtPeriodEnd === true || 
    cancelAtPeriodEnd === 'true' ||
    cancelAtPeriodEnd === 1
  );

  const handleCancelClick = () => {
    if (!subscription) return;
    const userState = getUserStateContextFromSubscription(subscription, null);
    const isTrialWithoutPaymentMethod = subscription.status === 'trialing' && hasPaymentMethod === false;
    const cancelButtonText = isTrialWithoutPaymentMethod ? 'Cancel Trial' : 'Cancel Subscription';
    
    trackEvent(isTrialWithoutPaymentMethod ? 'User Clicked Cancel Trial Button' : 'User Clicked Cancel Subscription Button', {
      'Button Section': 'Billing Actions Section',
      'Button Position': 'Right side of Manage Subscription Card',
      'Button Text': cancelButtonText,
      'Current Plan': subscription.plan,
      'Current Billing Cadence': subscription.billing_cadence,
      'Days Since Subscription Start': userState.daysSinceSubscriptionStart,
      'Days Until Period End': userState.daysUntilPeriodEnd,
      'Has Used Feature': false,
      'Feature Usage Count': 0,
      'Has Payment Method': hasPaymentMethod,
      'Is Trial Without Payment Method': isTrialWithoutPaymentMethod,
    });
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    if (!subscription) return;
    
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

      const userState = getUserStateContextFromSubscription(subscription, null);
      
      // Track success
      trackEvent('Subscription Canceled Successfully', {
        'Current Plan': subscription.plan,
        'Current Billing Cadence': subscription.billing_cadence,
        'Cancel at Period End': true,
        'Days Until Period End': userState.daysUntilPeriodEnd,
        'Cancel Date': new Date().toISOString(),
      });

      setSuccessMessage('Your subscription will be canceled at the end of the current billing period.');
      setShowCancelConfirm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;
    
    const userState = getUserStateContextFromSubscription(subscription, null);
    
    trackEvent('User Clicked Reactivate Subscription Button', {
      'Button Section': 'Billing Actions Section',
      'Button Position': 'Right side of Manage Subscription Card',
      'Button Text': 'Reactivate Subscription',
      'Current Plan': subscription.plan,
      'Current Billing Cadence': subscription.billing_cadence,
      'Days Until Period End': userState.daysUntilPeriodEnd,
    });

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
    if (!subscription) return;
    
    trackEvent('User Clicked Update Payment Method Button', {
      'Button Section': 'Billing Actions Section',
      'Button Position': 'Left side of Manage Subscription Card',
      'Button Text': 'Update Payment Method',
      'Current Plan': subscription.plan,
      'Subscription Status': subscription.status,
      'Has Past Due': subscription.status === 'past_due',
    });
    setShowPaymentUpdate(true);
  };

  const handlePaymentUpdateSuccess = () => {
    setSuccessMessage('Payment method updated successfully!');
    router.refresh();
  };

  // Fetch payment method status
  useEffect(() => {
    if (!subscription) return;

    const fetchPaymentMethodStatus = async () => {
      try {
        const response = await fetch('/api/billing/payment-method-status');
        if (response.ok) {
          const data = await response.json();
          setHasPaymentMethod(data.hasPaymentMethod);
        }
      } catch (error) {
        console.error('Error fetching payment method status:', error);
        setHasPaymentMethod(false);
      }
    };

    fetchPaymentMethodStatus();
  }, [subscription]);

  if (!subscription) {
    return null;
  }

  const isCanceled = subscription.status === 'canceled';
  const isTrialWithoutPaymentMethod = subscription.status === 'trialing' && hasPaymentMethod === false;
  const paymentButtonText = hasPaymentMethod === false ? 'Add Payment Method' : 'Update Payment Method';
  const cancelButtonText = isTrialWithoutPaymentMethod ? 'Cancel Trial' : 'Cancel Subscription';

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

        {isCanceled ? (
          <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
            <p className="text-gray-700 font-semibold mb-4">
              This subscription has been canceled. To continue using Product Careerlyst, please create a new subscription.
            </p>
            <div className="flex gap-4">
              <TrackedButton
                onClick={() => router.push('/dashboard/billing/plans')}
                buttonId="billing-page-view-plans-button"
                eventName="User Clicked View Plans Button"
                eventProperties={{
                  'Button Section': 'Billing Actions Section',
                  'Button Position': 'Left side of Manage Subscription Card',
                  'Button Text': 'View Plans',
                  'Current Plan': subscription.plan,
                  'Subscription Status': subscription.status,
                }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition-colors border-2 border-purple-200"
              >
                View Plans
              </TrackedButton>
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <TrackedButton
              onClick={handlePaymentMethodUpdate}
              buttonId="billing-page-update-payment-method-button"
              eventName={hasPaymentMethod === false ? "User Clicked Add Payment Method Button" : "User Clicked Update Payment Method Button"}
              eventProperties={{
                'Button Section': 'Billing Actions Section',
                'Button Position': 'Left side of Manage Subscription Card',
                'Button Text': paymentButtonText,
                'Current Plan': subscription.plan,
                'Subscription Status': subscription.status,
                'Has Past Due': subscription.status === 'past_due',
                'Has Payment Method': hasPaymentMethod,
                'Is Trial Without Payment Method': isTrialWithoutPaymentMethod,
              }}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-purple-200"
            >
              <CreditCard className="w-4 h-4" />
              {paymentButtonText}
            </TrackedButton>

            {willCancel ? (
              <TrackedButton
                onClick={handleReactivateSubscription}
                buttonId="billing-page-reactivate-subscription-button"
                eventName="User Clicked Reactivate Subscription Button"
                eventProperties={{
                  'Button Section': 'Billing Actions Section',
                  'Button Position': 'Right side of Manage Subscription Card',
                  'Button Text': 'Reactivate Subscription',
                  'Current Plan': subscription.plan,
                  'Current Billing Cadence': subscription.billing_cadence,
                  'Days Until Period End': getUserStateContextFromSubscription(subscription, null).daysUntilPeriodEnd,
                }}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-100 text-green-700 font-bold hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-green-200"
              >
                <RotateCcw className="w-4 h-4" />
                {loading ? 'Reactivating...' : 'Reactivate Subscription'}
              </TrackedButton>
            ) : (
              <TrackedButton
                onClick={handleCancelClick}
                buttonId="billing-page-cancel-subscription-button"
                eventName={isTrialWithoutPaymentMethod ? "User Clicked Cancel Trial Button" : "User Clicked Cancel Subscription Button"}
                eventProperties={{
                  'Button Section': 'Billing Actions Section',
                  'Button Position': 'Right side of Manage Subscription Card',
                  'Button Text': cancelButtonText,
                  'Current Plan': subscription.plan,
                  'Current Billing Cadence': subscription.billing_cadence,
                  'Days Since Subscription Start': getUserStateContextFromSubscription(subscription, null).daysSinceSubscriptionStart,
                  'Days Until Period End': getUserStateContextFromSubscription(subscription, null).daysUntilPeriodEnd,
                  'Has Used Feature': false,
                  'Feature Usage Count': 0,
                  'Has Payment Method': hasPaymentMethod,
                  'Is Trial Without Payment Method': isTrialWithoutPaymentMethod,
                }}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-200"
              >
                <X className="w-4 h-4" />
                {cancelButtonText}
              </TrackedButton>
            )}
          </div>
        )}
      </div>

      {showPaymentUpdate && (
        <PaymentMethodUpdate
          onClose={() => setShowPaymentUpdate(false)}
          onSuccess={handlePaymentUpdateSuccess}
          subscription={subscription}
        />
      )}

      {showCancelConfirm && subscription && (
        <CancelConfirmModal
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelConfirm(false)}
          loading={loading}
          subscription={subscription}
        />
      )}
    </>
  );
};

