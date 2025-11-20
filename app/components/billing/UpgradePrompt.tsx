'use client';

import { useRouter } from 'next/navigation';
import { Zap, ArrowRight } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  currentPlan?: 'learn' | null;
  limit?: number | null;
  current?: number;
}

export const UpgradePrompt = ({ feature, currentPlan, limit, current }: UpgradePromptProps) => {
  const router = useRouter();

  if (currentPlan === 'accelerate') {
    return null; // Already on highest plan
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <div className="flex items-start gap-4">
        <Zap className="w-6 h-6 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-black text-xl mb-2">Upgrade to Accelerate</h3>
          <p className="font-semibold mb-4">
            {limit !== null && current !== undefined
              ? `You've used ${current} of ${limit} ${feature} this month.`
              : `Unlock unlimited ${feature} with Accelerate.`}
          </p>
          <button
            onClick={() => router.push('/dashboard/billing/plans')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-purple-600 font-bold hover:bg-gray-100 transition-colors"
          >
            View Plans
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

