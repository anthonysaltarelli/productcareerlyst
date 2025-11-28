'use client';

import { useState, useEffect } from 'react';
import { Subscription } from '@/lib/utils/subscription';
import { Check, X, Clock, DollarSign, Calendar } from 'lucide-react';

interface BillingStatusProps {
  subscription: Subscription | null;
}

interface UpcomingInvoice {
  amount_due: number;
  currency: string | null;
  period_start: number | null;
  period_end: number | null;
  next_payment_date?: number | null;
  subtotal: number;
  total: number;
  description: string | null;
  discount?: {
    percentOff?: number;
    amountOff?: number;
    couponId?: string;
    couponName?: string;
  } | null;
  refunded?: boolean;
  payment_overdue?: boolean;
}

export const BillingStatus = ({ subscription }: BillingStatusProps) => {
  const [upcomingInvoice, setUpcomingInvoice] = useState<UpcomingInvoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [trialProgress, setTrialProgress] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  if (!subscription) {
    return null;
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const isPastDue = subscription.status === 'past_due';
  
  // Ensure cancel_at_period_end is properly converted to boolean
  // Handle cases where it might be a string "true"/"false" or null/undefined from database
  const cancelAtPeriodEnd = subscription.cancel_at_period_end as any;
  const willCancel = Boolean(
    cancelAtPeriodEnd === true || 
    cancelAtPeriodEnd === 'true' ||
    cancelAtPeriodEnd === 1
  );

  // Debug logging
  console.log('BillingStatus - Subscription data:', {
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at_period_end_type: typeof subscription.cancel_at_period_end,
    willCancel,
    status: subscription.status,
    current_period_end: subscription.current_period_end,
  });

  const planNames = {
    learn: 'Learn',
    accelerate: 'Accelerate',
  };

  const billingLabels = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };

  // Mark component as mounted to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchUpcomingInvoice = async () => {
      if (!subscription) {
        setLoadingInvoice(false);
        return;
      }

      try {
        const response = await fetch('/api/billing/upcoming-invoice');
        if (response.ok) {
          const data = await response.json();
          console.log('Upcoming invoice data:', data);
          setUpcomingInvoice(data);
        }
      } catch (error) {
        console.error('Error fetching upcoming invoice:', error);
      } finally {
        setLoadingInvoice(false);
      }
    };

    fetchUpcomingInvoice();
  }, [subscription]);

  // Calculate trial progress and days remaining only on client side after mount
  useEffect(() => {
    if (!isMounted) return;

    const isTrialActive = subscription.status === 'trialing';
    
    if (isTrialActive && subscription.trial_end) {
      // Calculate trial days remaining
      const endDate = typeof subscription.trial_end === 'string' 
        ? new Date(subscription.trial_end) 
        : new Date(subscription.trial_end * 1000);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTrialDaysRemaining(Math.max(0, diffDays));
    } else {
      setTrialDaysRemaining(null);
    }

    if (isTrialActive && subscription.trial_start && subscription.trial_end) {
      // Calculate trial progress percentage
      const startDate = typeof subscription.trial_start === 'string' 
        ? new Date(subscription.trial_start) 
        : new Date(subscription.trial_start * 1000);
      const endDate = typeof subscription.trial_end === 'string' 
        ? new Date(subscription.trial_end) 
        : new Date(subscription.trial_end * 1000);
      const now = new Date();
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      setTrialProgress(progress);
    } else {
      setTrialProgress(null);
    }
  }, [isMounted, subscription.status, subscription.trial_start, subscription.trial_end]);

  const formatDate = (dateInput: string | number | null) => {
    if (!dateInput) return null;
    const date = typeof dateInput === 'string' 
      ? new Date(dateInput) 
      : new Date(dateInput * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string | null) => {
    if (!currency) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const isTrialActive = subscription.status === 'trialing';
  const isTrialEndingSoon = trialDaysRemaining !== null && trialDaysRemaining <= 2;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
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
          <div className="flex flex-col items-end gap-2">
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
            {willCancel && (
              <div className="px-3 py-1 rounded-lg bg-yellow-100 text-yellow-800 text-sm font-bold">
                Canceling on {formatDate(subscription.current_period_end) || 'N/A'}
              </div>
            )}
          </div>
        </div>
      </div>

      {willCancel && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200">
          <p className="text-yellow-800 font-semibold">
            ⚠️ Your subscription will cancel on {formatDate(subscription.current_period_end) || 'the end of the billing period'}.
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

      {/* Enhanced Trial Information */}
      {isTrialActive && (
        <div className="mb-6 space-y-4">
          {/* Trial Banner */}
          <div className={`p-6 rounded-xl border-2 ${
            isTrialEndingSoon
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-1">
                  7-Day Free Trial
                </h3>
                {trialDaysRemaining !== null && (
                  <p className={`text-2xl font-black ${
                    isTrialEndingSoon ? 'text-yellow-800' : 'text-blue-900'
                  }`}>
                    {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining
                  </p>
                )}
              </div>
              <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 text-sm font-bold">
                TRIAL ACTIVE
              </div>
            </div>

            {/* Trial Progress Bar */}
            {trialProgress !== null && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
                  <span>Trial Progress</span>
                  <span>{Math.round(trialProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      isTrialEndingSoon ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${trialProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Trial Dates */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {subscription.trial_start && (
                <div>
                  <div className="text-gray-600 font-semibold mb-1">Trial Started</div>
                  <div className="text-gray-900 font-bold">
                    {formatDate(subscription.trial_start)}
                  </div>
                </div>
              )}
              {subscription.trial_end && (
                <div>
                  <div className="text-gray-600 font-semibold mb-1">Trial Ends</div>
                  <div className="text-gray-900 font-bold">
                    {formatDate(subscription.trial_end)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trial Conversion Info */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h4 className="font-black text-gray-900 mb-4">After Your Trial</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-semibold">Plan</span>
                <span className="text-gray-900 font-bold">
                  {planNames[subscription.plan]} Plan
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-semibold">Billing</span>
                <span className="text-gray-900 font-bold">
                  {billingLabels[subscription.billing_cadence]}
                </span>
              </div>
              {upcomingInvoice && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-semibold">First Charge</span>
                    <div className="text-right">
                      {upcomingInvoice.discount && upcomingInvoice.subtotal !== upcomingInvoice.amount_due ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-gray-400 line-through text-sm">
                            {formatAmount(upcomingInvoice.subtotal, upcomingInvoice.currency)}
                          </span>
                          <span className="text-green-600 font-bold">
                            {formatAmount(upcomingInvoice.amount_due, upcomingInvoice.currency)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-900 font-bold">
                          {formatAmount(upcomingInvoice.amount_due, upcomingInvoice.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  {upcomingInvoice.discount && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-semibold">Discount</span>
                      <span className="text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full text-sm">
                        {upcomingInvoice.discount.percentOff 
                          ? `${upcomingInvoice.discount.percentOff}% off` 
                          : upcomingInvoice.discount.amountOff 
                            ? `${formatAmount(upcomingInvoice.discount.amountOff, upcomingInvoice.currency)} off`
                            : 'Discount applied'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-semibold">Charge Date</span>
                    <span className="text-gray-900 font-bold">
                      {formatDate(subscription.trial_end)}
                    </span>
                  </div>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-600 font-semibold">
              Your card will be charged on {formatDate(subscription.trial_end) || 'the trial end date'}.
            </p>
          </div>

          {/* Trial Ending Soon Warning */}
          {isTrialEndingSoon && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
              <p className="text-yellow-800 font-semibold">
                ⚠️ Your trial is ending soon! Your subscription will automatically convert to a paid plan on {formatDate(subscription.trial_end) || 'the trial end date'}.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-xl bg-gray-50">
          <div className="text-sm text-gray-600 font-semibold mb-1">Current Period</div>
          <div className="text-lg font-black text-gray-900">
            {formatDate(subscription.current_period_start) || 'N/A'} -{' '}
            {formatDate(subscription.current_period_end) || 'N/A'}
          </div>
        </div>
        {upcomingInvoice && !willCancel ? (
          <div className={`p-4 rounded-xl ${upcomingInvoice.payment_overdue ? 'bg-orange-50 border-2 border-orange-200' : 'bg-gray-50'}`}>
            <div className="text-sm text-gray-600 font-semibold mb-1">Next Payment</div>
            {upcomingInvoice.payment_overdue && (
              <div className="mb-2 text-sm text-orange-700 font-bold">
                ⚠️ Payment overdue - previous charge was refunded
              </div>
            )}
            <div className={`text-lg font-black ${upcomingInvoice.payment_overdue ? 'text-orange-700' : 'text-gray-900'}`}>
              {upcomingInvoice.discount && upcomingInvoice.subtotal !== upcomingInvoice.amount_due ? (
                <>
                  <span className="text-gray-400 line-through text-sm mr-2">
                    {formatAmount(upcomingInvoice.subtotal, upcomingInvoice.currency)}
                  </span>
                  <span className={upcomingInvoice.payment_overdue ? 'text-orange-600' : 'text-green-600'}>
                    {formatAmount(upcomingInvoice.amount_due, upcomingInvoice.currency)}
                  </span>
                </>
              ) : (
                formatAmount(upcomingInvoice.amount_due, upcomingInvoice.currency)
              )}{' '}
              {upcomingInvoice.payment_overdue ? 'due now' : 'owed on'}{' '}
              {upcomingInvoice.payment_overdue 
                ? 'immediately' 
                : formatDate(upcomingInvoice.next_payment_date || upcomingInvoice.period_start || upcomingInvoice.period_end) || 
                  (subscription?.current_period_end ? formatDate(subscription.current_period_end) : 'N/A')}
            </div>
            {upcomingInvoice.discount && (
              <div className="mt-1 text-sm text-green-600 font-semibold">
                {upcomingInvoice.discount.percentOff 
                  ? `${upcomingInvoice.discount.percentOff}% discount applied` 
                  : upcomingInvoice.discount.amountOff 
                    ? `${formatAmount(upcomingInvoice.discount.amountOff, upcomingInvoice.currency)} discount applied`
                    : 'Discount applied'}
              </div>
            )}
            {upcomingInvoice.refunded && !upcomingInvoice.payment_overdue && (
              <div className="mt-1 text-sm text-orange-600 font-semibold">
                Previous payment was refunded
              </div>
            )}
          </div>
        ) : willCancel ? (
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-sm text-gray-600 font-semibold mb-1">Next Payment</div>
            <div className="text-lg font-black text-gray-900">
              No upcoming charges (subscription ending)
            </div>
          </div>
        ) : subscription.trial_end ? (
          <div className="p-4 rounded-xl bg-blue-50">
            <div className="text-sm text-blue-600 font-semibold mb-1">Trial Ends</div>
            <div className="text-lg font-black text-blue-900">
              {formatDate(subscription.trial_end) || 'N/A'}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

