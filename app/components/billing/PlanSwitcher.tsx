'use client';

import { useState, useEffect } from 'react';
import { Subscription } from '@/lib/utils/subscription';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlanSwitcherProps {
  subscription: Subscription | null;
}

const plans = {
  learn: {
    name: 'Learn',
    description: 'Perfect for getting started',
    monthly: { price: 12 },
    quarterly: { price: 27, savings: '25%' },
    yearly: { price: 84, savings: '42%' },
  },
  accelerate: {
    name: 'Accelerate',
    description: 'Most popular - Unlimited everything',
    monthly: { price: 20 },
    quarterly: { price: 48, savings: '20%' },
    yearly: { price: 144, savings: '40%' },
  },
};

export const PlanSwitcher = ({ subscription }: PlanSwitcherProps) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'learn' | 'accelerate' | null>(
    subscription?.plan || null
  );
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'quarterly' | 'yearly' | null>(
    subscription?.billing_cadence || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when subscription changes (after refresh)
  useEffect(() => {
    if (subscription) {
      setSelectedPlan(subscription.plan);
      setSelectedBilling(subscription.billing_cadence);
      setSuccess(false);
      setError(null);
      setLoading(false);
    }
  }, [subscription?.plan, subscription?.billing_cadence]);

  if (!subscription) {
    return null;
  }

  const isCurrentSelection = 
    selectedPlan === subscription.plan && 
    selectedBilling === subscription.billing_cadence;

  // Check if subscription is set to cancel at period end
  const cancelAtPeriodEnd = subscription.cancel_at_period_end as any;
  const willCancel = Boolean(
    cancelAtPeriodEnd === true || 
    cancelAtPeriodEnd === 'true' ||
    cancelAtPeriodEnd === 1
  );

  const handleUpdate = async () => {
    if (!selectedPlan || !selectedBilling || isCurrentSelection) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/billing/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCadence: selectedBilling,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription');
      }

      setSuccess(true);
      setLoading(false);
      // Collapse the component and refresh after showing success message
      setTimeout(() => {
        setIsExpanded(false);
        // Refresh to get updated subscription data
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
    // Reset selections to current subscription when expanding
    setSelectedPlan(subscription.plan);
    setSelectedBilling(subscription.billing_cadence);
    setError(null);
    setSuccess(false);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setSelectedPlan(subscription.plan);
    setSelectedBilling(subscription.billing_cadence);
    setError(null);
    setSuccess(false);
  };

  const planNames = {
    learn: 'Learn',
    accelerate: 'Accelerate',
  };

  const billingLabels = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };

  // Collapsed view - just show a button to expand
  if (!isExpanded) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Change Plan or Billing Cycle</h2>
            <p className="text-gray-600 font-semibold">
              Switch plans or billing cycles. Changes are prorated automatically.
            </p>
          </div>
          <button
            onClick={handleExpand}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            Update Plan
          </button>
        </div>
      </div>
    );
  }

  // Expanded view - show full selection UI
  return (
    <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-black text-gray-900">Change Plan or Billing Cycle</h2>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
        <p className="text-gray-600 font-semibold">
          Switch plans or billing cycles. Changes are prorated automatically.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border-2 border-green-200">
          <p className="text-green-700 font-semibold">
            ✓ Subscription updated successfully! Refreshing...
          </p>
        </div>
      )}

      {/* Current Plan Display */}
      <div className="mb-8 p-4 rounded-xl bg-purple-50 border-2 border-purple-200">
        <div className="text-sm text-purple-600 font-semibold mb-1">Current Plan</div>
        <div className="text-xl font-black text-purple-900">
          {planNames[subscription.plan]} - {billingLabels[subscription.billing_cadence]}
        </div>
        <div className="text-sm text-purple-700 mt-1">
          ${plans[subscription.plan][subscription.billing_cadence].price}
          {subscription.billing_cadence === 'monthly' && '/month'}
          {subscription.billing_cadence === 'quarterly' && '/quarter'}
          {subscription.billing_cadence === 'yearly' && '/year'}
        </div>
        {willCancel && (
          <div className="mt-3 p-2 rounded-lg bg-yellow-100 border border-yellow-300">
            <p className="text-xs text-yellow-800 font-semibold">
              ⚠️ Your subscription is set to cancel. Updating your plan will remove the cancellation and reactivate your subscription.
            </p>
          </div>
        )}
      </div>

      {/* Plan Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Select Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(plans).map(([key, plan]) => (
            <button
              key={key}
              onClick={() => setSelectedPlan(key as 'learn' | 'accelerate')}
              disabled={loading}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedPlan === key
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-purple-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg text-gray-900">{plan.name}</div>
                  <div className="text-sm text-gray-600">{plan.description}</div>
                </div>
                {selectedPlan === key && (
                  <Check className="w-6 h-6 text-purple-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Billing Cycle Selection */}
      {selectedPlan && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Select Billing Cycle</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['monthly', 'quarterly', 'yearly'] as const).map((billing) => {
              const planData = plans[selectedPlan];
              const billingData = planData[billing];
              const isSelected = selectedBilling === billing;

              return (
                <button
                  key={billing}
                  onClick={() => setSelectedBilling(billing)}
                  disabled={loading}
                  className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {billingData.savings && (
                    <div className="absolute -top-2 -right-2 px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-bold">
                      {billingData.savings} OFF
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-lg text-gray-900">
                      {billingLabels[billing]}
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div className="text-2xl font-black text-purple-600">
                    ${billingData.price}
                    {billing === 'monthly' && '/mo'}
                    {billing === 'quarterly' && '/3mo'}
                    {billing === 'yearly' && '/yr'}
                  </div>
                  {billing !== 'monthly' && (
                    <div className="text-sm text-gray-500 mt-1">
                      ${(billingData.price / (billing === 'quarterly' ? 3 : 12)).toFixed(0)}/mo
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Update Button */}
      {selectedPlan && selectedBilling && !isCurrentSelection && (
        <div className="mt-6">
          <button
            onClick={handleUpdate}
            disabled={loading || isCurrentSelection}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Updating Subscription...
              </>
            ) : (
              <>
                Update Subscription
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-sm text-gray-600 text-center mt-3">
            Your subscription will be updated immediately with automatic proration. 
            You'll be charged or credited the difference based on the time remaining in your billing period.
          </p>
        </div>
      )}

      {isCurrentSelection && selectedPlan && selectedBilling && (
        <div className="mt-6 p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
          <p className="text-gray-700 font-semibold text-center">
            You're already on the {planNames[selectedPlan]} plan with {billingLabels[selectedBilling]} billing.
          </p>
        </div>
      )}
    </div>
  );
};

