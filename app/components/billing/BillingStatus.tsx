'use client';

import { Subscription } from '@/lib/utils/subscription';
import { Check, X, Clock } from 'lucide-react';

interface BillingStatusProps {
  subscription: Subscription | null;
}

export const BillingStatus = ({ subscription }: BillingStatusProps) => {
  if (!subscription) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8 mb-6">
        <div className="text-center">
          <X className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">No Active Subscription</h2>
          <p className="text-gray-600 font-semibold mb-6">
            You don't have an active subscription. Choose a plan to get started!
          </p>
          <a
            href="/dashboard/billing/plans"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            View Plans
          </a>
        </div>
      </div>
    );
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const isPastDue = subscription.status === 'past_due';
  const willCancel = subscription.cancel_at_period_end;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  return (
    <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8 mb-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {isActive ? (
              <Check className="w-6 h-6 text-green-600" />
            ) : (
              <Clock className="w-6 h-6 text-yellow-600" />
            )}
            <h2 className="text-2xl font-black text-gray-900">
              {planNames[subscription.plan]} Plan
            </h2>
            {subscription.status === 'trialing' && (
              <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-sm font-bold">
                TRIAL
              </span>
            )}
          </div>
          <p className="text-gray-600 font-semibold">
            {billingLabels[subscription.billing_cadence]} Billing
          </p>
        </div>
        <div className="text-right">
          <div
            className={`px-4 py-2 rounded-xl font-bold ${
              isActive
                ? 'bg-green-100 text-green-700'
                : isPastDue
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {subscription.status.toUpperCase().replace('_', ' ')}
          </div>
        </div>
      </div>

      {willCancel && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200">
          <p className="text-yellow-800 font-semibold">
            ⚠️ Your subscription will cancel on {formatDate(subscription.current_period_end)}.
            You'll continue to have access until then.
          </p>
        </div>
      )}

      {isPastDue && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200">
          <p className="text-red-800 font-semibold">
            ⚠️ Your payment failed. Please update your payment method to continue service.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gray-50">
          <div className="text-sm text-gray-600 font-semibold mb-1">Current Period</div>
          <div className="text-lg font-black text-gray-900">
            {formatDate(subscription.current_period_start)} -{' '}
            {formatDate(subscription.current_period_end)}
          </div>
        </div>
        {subscription.trial_end && (
          <div className="p-4 rounded-xl bg-blue-50">
            <div className="text-sm text-blue-600 font-semibold mb-1">Trial Ends</div>
            <div className="text-lg font-black text-blue-900">
              {formatDate(subscription.trial_end)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

