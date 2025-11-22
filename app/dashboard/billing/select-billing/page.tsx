'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ArrowLeft } from 'lucide-react';

const plans = {
  learn: {
    name: 'Learn',
    monthly: { price: 12 },
    quarterly: { price: 27, savings: '25%' },
    yearly: { price: 84, savings: '42%' },
  },
  accelerate: {
    name: 'Accelerate',
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

export default function SelectBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');

  const plan = searchParams.get('plan') as 'learn' | 'accelerate' | null;

  useEffect(() => {
    if (!plan) {
      router.push('/dashboard/billing');
      return;
    }
  }, [plan, router]);

  if (!plan) {
    return null;
  }

  const planData = plans[plan];

  const handleContinue = () => {
    if (selectedBilling) {
      router.push(`/dashboard/billing/checkout?plan=${plan}&billing=${selectedBilling}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-700 font-semibold mb-8 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4">
            Choose Your Billing Cycle
          </h1>
          <p className="text-lg text-gray-700 font-semibold">
            Select how you'd like to be billed for the {planData.name} plan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {(['monthly', 'quarterly', 'yearly'] as const).map((billing) => {
            const billingData = planData[billing];
            const isSelected = selectedBilling === billing;
            const monthlyEquivalent =
              billing === 'monthly'
                ? billingData.price
                : billing === 'quarterly'
                  ? billingData.price / 3
                  : billingData.price / 12;

            const isYearly = billing === 'yearly';

            return (
              <button
                key={billing}
                onClick={() => setSelectedBilling(billing)}
                className={`relative p-8 rounded-[2.5rem] border-2 transition-all text-left ${
                  isSelected
                    ? 'border-purple-500 bg-white ring-4 ring-purple-200 shadow-xl'
                    : 'border-gray-200 bg-white hover:border-purple-300 shadow-lg'
                } ${isYearly ? 'ring-2 ring-purple-300' : ''}`}
              >
                {'savings' in billingData && billingData.savings && (
                  <div className="absolute -top-3 -right-3 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg">
                    {billingData.savings} OFF
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className="font-black text-2xl text-gray-900">
                    {billingLabels[billing]}
                  </div>
                  {isSelected && (
                    <div className="p-2 rounded-full bg-purple-600">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-black text-purple-600">
                    ${billingData.price}
                    {billing === 'monthly' && '/mo'}
                    {billing === 'quarterly' && '/3mo'}
                    {billing === 'yearly' && '/yr'}
                  </div>
                  {billing !== 'monthly' && (
                    <div className="text-lg text-gray-600 font-semibold">
                      ${monthlyEquivalent.toFixed(0)}/mo
                    </div>
                  )}
                  {billing === 'yearly' && (
                    <div className="pt-2 text-sm text-green-600 font-bold">
                      Best Value - Save {plan === 'learn' ? '42' : '40'}% annually
                    </div>
                  )}
                </div>
                {isYearly && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-center">
                      <span className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold">
                        MOST POPULAR
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            className="px-12 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

