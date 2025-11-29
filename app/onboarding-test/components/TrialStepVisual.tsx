'use client';

import { useState } from 'react';
import { CheckCircle, Sparkles, Rocket, Zap } from 'lucide-react';

interface TrialStepVisualProps {
  onBack: () => void;
}

const ACCELERATE_PLAN = {
  name: 'Accelerate',
  monthly: { price: 20 },
  quarterly: { price: 48, savings: '20%' },
  yearly: { price: 144, savings: '40%' },
};

const billingLabels = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export const TrialStepVisual = ({ onBack }: TrialStepVisualProps) => {
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const price = ACCELERATE_PLAN[selectedBilling].price;
  const monthlyEquivalent =
    selectedBilling === 'monthly'
      ? price
      : selectedBilling === 'quarterly'
        ? price / 3
        : price / 12;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-3 md:mb-4">
          Start Your Free Trial
        </h3>
        <p className="text-base md:text-lg text-gray-700 font-semibold">
          Get 7 days free to explore all of our premium, AI-enabled features. Cancel anytime.
        </p>
      </div>

      {/* Accelerate Plan Preview */}
      <div className="mb-6 md:mb-8 md:bg-white md:rounded-2xl md:border-2 md:border-purple-200 md:p-8 md:shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            <Rocket className="w-6 h-6 md:w-8 md:h-8 text-pink-600" />
            <Zap className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
          </div>
          <h3 className="text-xl md:text-2xl font-black text-gray-900">Free 7 Day Accelerate Trial</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="flex flex-col">
            <h4 className="font-black text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Popular Features:</h4>
            <ul className="space-y-1.5 md:space-y-2 text-gray-700 font-semibold text-sm md:text-base">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                Unlimited resume optimizations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                AI-powered resume analysis
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                Contact discovery & outreach
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                Company research & insights
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                Custom interview questions
              </li>
            </ul>
            
            {/* Highlighted Portfolio Feature */}
            <div className="mt-3 md:mt-4 flex-1 flex items-center p-3 md:p-4 bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 border-2 border-purple-300 rounded-xl">
              <p className="text-sm md:text-base font-bold text-purple-900">
                Launch a professionally designed Product Portfolio in minutes
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-black text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Pricing:</h4>
            <div className="space-y-2 md:space-y-3">
              {(['monthly', 'quarterly', 'yearly'] as const).map((cadence) => {
                const originalMonthly = cadence === 'monthly' ? ACCELERATE_PLAN[cadence].price : Math.round(ACCELERATE_PLAN[cadence].price / (cadence === 'quarterly' ? 3 : 12));
                
                return (
                  <label
                    key={cadence}
                    className={`relative flex items-center justify-between p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedBilling === cadence
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    {cadence === 'yearly' && (
                      <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                        Most Popular
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2 flex-wrap">
                        {billingLabels[cadence]}
                        {'savings' in ACCELERATE_PLAN[cadence] && (
                          <span className="text-green-600 text-xs font-bold">
                            ({(ACCELERATE_PLAN[cadence] as { price: number; savings: string }).savings} off)
                          </span>
                        )}
                      </div>
                      <div className="text-xs md:text-sm font-semibold flex items-center gap-2 flex-wrap">
                        <span className="text-gray-600">${originalMonthly}/mo</span>
                        {cadence !== 'monthly' && (
                          <span className="text-gray-500">
                            billed {cadence === 'quarterly' ? 'quarterly' : 'annually'}
                          </span>
                        )}
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="billing"
                      value={cadence}
                      checked={selectedBilling === cadence}
                      onChange={(e) => setSelectedBilling(e.target.value as typeof selectedBilling)}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {!showPaymentForm ? (
          <>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="w-full px-6 md:px-8 py-3 md:py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all text-sm md:text-base"
            >
              Start 7-Day Free Trial
            </button>
            <p className="text-xs md:text-sm text-gray-500 mt-2 text-center">
              You will not be charged today. Switch plans or cancel any time.
            </p>
          </>
        ) : (
          <div className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
            <p className="text-center text-gray-600 font-semibold">
              🧪 TEST MODE: Payment form would appear here
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              In the real flow, Stripe payment form would be displayed here
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 md:mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 md:px-6 py-2 md:py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors text-sm md:text-base"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

