'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight } from 'lucide-react';
import { TrackedButton } from '@/app/components/TrackedButton';
import { trackEvent } from '@/lib/amplitude/client';

interface UpgradePromptProps {
  feature: string;
  currentPlan?: 'learn' | 'accelerate' | null;
  limit?: number | null;
  current?: number;
}

export const UpgradePrompt = ({ feature, currentPlan, limit, current }: UpgradePromptProps) => {
  const router = useRouter();
  const tracked = useRef(false);

  if (currentPlan === 'accelerate' || !currentPlan) {
    return null; // Already on highest plan or no plan
  }

  // Track component view
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
    const usagePercentage = limit != null && current !== undefined && limit > 0
      ? Math.round((current / limit) * 100)
      : null;

    trackEvent('User Viewed Upgrade Prompt', {
      'Component Type': 'upgrade_prompt',
      'Feature Name': feature,
      'Current Plan': 'learn',
      'Current Usage': current ?? 0,
      'Feature Limit': limit ?? 0,
      'Usage Percentage': usagePercentage,
      'Page Route': pageRoute,
      'Prompt Position': 'Inline',
    });
  }, [feature, current, limit]);

  const usagePercentage = limit != null && current !== undefined && limit > 0
    ? Math.round((current / limit) * 100)
    : null;

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <div className="flex items-start gap-4">
        <Zap className="w-6 h-6 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-black text-xl mb-2">Upgrade to Accelerate</h3>
          <p className="font-semibold mb-4">
            {limit != null && current !== undefined
              ? `You've used ${current} of ${limit} ${feature} this month.`
              : `Unlock unlimited ${feature} with Accelerate.`}
          </p>
          <TrackedButton
            onClick={() => router.push('/dashboard/billing/plans')}
            buttonId="upgrade-prompt-view-plans-button"
            eventName="User Clicked View Plans Button"
            eventProperties={{
              'Button Section': 'Upgrade Prompt Component',
              'Button Position': 'Bottom of prompt card',
              'Button Text': 'View Plans',
              'Feature Name': feature,
              'Current Plan': 'learn',
              'Current Usage': current ?? 0,
              'Feature Limit': limit ?? 0,
              'Usage Percentage': usagePercentage,
              'Page Route': typeof window !== 'undefined' ? window.location.pathname : '/',
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-purple-600 font-bold hover:bg-gray-100 transition-colors"
          >
            View Plans
            <ArrowRight className="w-5 h-5" />
          </TrackedButton>
        </div>
      </div>
    </div>
  );
};

