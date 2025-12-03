'use client';

import { useState, useEffect } from 'react';
import { Subscription } from '@/lib/utils/subscription';
import { Calendar } from 'lucide-react';

interface TrialBillingStatusProps {
  subscription: Subscription | null;
}

export const TrialBillingStatus = ({ subscription }: TrialBillingStatusProps) => {
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  if (!subscription || subscription.status !== 'trialing') {
    return null;
  }

  const planNames = {
    learn: 'Learn',
    accelerate: 'Accelerate',
  };

  // Mark component as mounted to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate trial days remaining only on client side after mount
  useEffect(() => {
    if (!isMounted) return;

    if (subscription.trial_end) {
      const endDate = typeof subscription.trial_end === 'string' 
        ? new Date(subscription.trial_end) 
        : new Date(subscription.trial_end * 1000);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTrialDaysRemaining(Math.max(0, diffDays));
    }
  }, [isMounted, subscription.trial_end]);

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

  return (
    <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-purple-600" />
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            {planNames[subscription.plan]} Plan Trial
          </h2>
          <p className="text-gray-600 font-semibold">
            {trialDaysRemaining !== null 
              ? `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'} remaining`
              : 'Active trial'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subscription.trial_start && (
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-sm text-gray-600 font-semibold mb-1">Trial Started</div>
            <div className="text-lg font-black text-gray-900">
              {formatDate(subscription.trial_start)}
            </div>
          </div>
        )}
        {subscription.trial_end && (
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="text-sm text-gray-600 font-semibold mb-1">Trial Ends</div>
            <div className="text-lg font-black text-gray-900">
              {formatDate(subscription.trial_end)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

