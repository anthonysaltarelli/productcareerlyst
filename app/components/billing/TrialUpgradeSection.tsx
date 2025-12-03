'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight } from 'lucide-react';
import { TrackedButton } from '@/app/components/TrackedButton';
import { trackEvent } from '@/lib/amplitude/client';
import { Subscription } from '@/lib/utils/subscription';

interface TrialUpgradeSectionProps {
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

const billingLabels = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export const TrialUpgradeSection = ({ subscription }: TrialUpgradeSectionProps) => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'learn' | 'accelerate'>(
    subscription?.plan || 'accelerate'
  );
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');

  const handleContinue = () => {
    trackEvent('User Clicked Continue to Upgrade Button', {
      'Button Section': 'Upgrade to Paid Plan Section',
      'Button Position': 'Bottom of upgrade section',
      'Button Text': 'Continue',
      'Plan Selected': selectedPlan,
      'Billing Cadence Selected': selectedBilling,
      'Price': plans[selectedPlan][selectedBilling].price,
      'Current Trial Plan': subscription?.plan || null,
    });

    router.push(`/dashboard/billing/select-billing?plan=${selectedPlan}&billing=${selectedBilling}`);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Upgrade to Paid Plan</h2>
        <p className="text-gray-600 font-semibold">
          Choose your plan and billing cycle to continue after your trial ends
        </p>
      </div>

      {/* Plan Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Select Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(plans).map(([key, plan]) => {
            const planKey = key as 'learn' | 'accelerate';
            const isSelected = selectedPlan === planKey;
            
            return (
              <button
                key={key}
                onClick={() => {
                  trackEvent('User Selected Plan in Upgrade Section', {
                    'Button Section': 'Upgrade to Paid Plan Section',
                    'Button Position': 'Plan Selection Cards',
                    'Plan Selected': planKey,
                    'Current Trial Plan': subscription?.plan || null,
                  });
                  setSelectedPlan(planKey);
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-purple-300'
                } cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg text-gray-900">{plan.name}</div>
                    <div className="text-sm text-gray-600">{plan.description}</div>
                  </div>
                  {isSelected && (
                    <Check className="w-6 h-6 text-purple-600" />
                  )}
                </div>
              </button>
            );
          })}
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
                  onClick={() => {
                    trackEvent('User Selected Billing Cycle in Upgrade Section', {
                      'Button Section': 'Upgrade to Paid Plan Section',
                      'Button Position': 'Billing Cycle Selection Cards',
                      'Billing Cycle Selected': billing,
                      'Plan Selected': selectedPlan,
                      'Price': billingData.price,
                      'Savings Percentage': 'savings' in billingData ? billingData.savings : null,
                    });
                    setSelectedBilling(billing);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-300'
                  } cursor-pointer`}
                >
                  {'savings' in billingData && billingData.savings && (
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
                    ${(billingData.price / (billing === 'monthly' ? 1 : billing === 'quarterly' ? 3 : 12)).toFixed(0)}/mo
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ${billingData.price} billed {billing === 'monthly' ? 'monthly' : billing === 'quarterly' ? 'quarterly' : 'yearly'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Continue Button */}
      {selectedPlan && selectedBilling && (
        <div className="mt-6">
          <TrackedButton
            onClick={handleContinue}
            buttonId="trial-upgrade-section-continue-button"
            eventName="User Clicked Continue to Upgrade Button"
            eventProperties={{
              'Button Section': 'Upgrade to Paid Plan Section',
              'Button Position': 'Bottom of upgrade section',
              'Button Text': 'Continue',
              'Plan Selected': selectedPlan,
              'Billing Cadence Selected': selectedBilling,
              'Price': plans[selectedPlan][selectedBilling].price,
              'Current Trial Plan': subscription?.plan || null,
            }}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </TrackedButton>
        </div>
      )}
    </div>
  );
};

