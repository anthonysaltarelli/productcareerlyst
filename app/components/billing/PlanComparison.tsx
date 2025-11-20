'use client';

import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

const plans = {
  learn: {
    name: 'Learn',
    description: 'Perfect for getting started',
    monthly: { price: 12, priceId: 'price_learn_monthly_12' },
    quarterly: { price: 27, priceId: 'price_learn_quarterly_27', savings: '25%' },
    yearly: { price: 84, priceId: 'price_learn_yearly_84', savings: '42%' },
    features: {
      courseLessons: true,
      resources: true,
      productPortfolioTemplate: false,
      pmEmailsDiscovered: 15,
      outreachMessagesCreated: 5,
      resumeBulletOptimizations: 30,
      resumeCustomizationsForJobs: 5,
      productPortfolioCaseStudyIdeas: 5,
      jobsTracked: 10,
      customQuestionsForInterviewers: 5,
      automatedCompanyResearchSearches: 5,
    },
  },
  accelerate: {
    name: 'Accelerate',
    description: 'Most popular - Unlimited everything',
    popular: true,
    monthly: { price: 20, priceId: 'price_accelerate_monthly_20' },
    quarterly: { price: 48, priceId: 'price_accelerate_quarterly_48', savings: '20%' },
    yearly: { price: 144, priceId: 'price_accelerate_yearly_144', savings: '40%' },
    features: {
      courseLessons: true,
      resources: true,
      productPortfolioTemplate: true,
      pmEmailsDiscovered: Infinity,
      outreachMessagesCreated: Infinity,
      resumeBulletOptimizations: Infinity,
      resumeCustomizationsForJobs: Infinity,
      productPortfolioCaseStudyIdeas: Infinity,
      jobsTracked: Infinity,
      customQuestionsForInterviewers: Infinity,
      automatedCompanyResearchSearches: Infinity,
    },
  },
};

export const PlanComparison = () => {
  const router = useRouter();

  const handleSelectPlan = (plan: 'learn' | 'accelerate', billing: 'monthly' | 'quarterly' | 'yearly') => {
    router.push(`/dashboard/billing/checkout?plan=${plan}&billing=${billing}`);
  };

  return (
    <div className="space-y-8">
      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            className={`relative p-8 rounded-[2.5rem] bg-white shadow-lg border-2 ${
              plan.popular
                ? 'border-purple-500 ring-4 ring-purple-200'
                : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-3xl font-black text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 font-semibold">{plan.description}</p>
            </div>

            {/* Pricing Options */}
            <div className="space-y-4 mb-6">
              <div
                className="p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-400 cursor-pointer transition-colors"
                onClick={() => handleSelectPlan(key as 'learn' | 'accelerate', 'monthly')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-lg text-gray-900">Monthly</div>
                    <div className="text-2xl font-black text-purple-600">${plan.monthly.price}/mo</div>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors">
                    Select
                  </button>
                </div>
              </div>

              <div
                className="p-4 rounded-2xl border-2 border-purple-400 hover:border-purple-500 cursor-pointer transition-colors relative"
                onClick={() => handleSelectPlan(key as 'learn' | 'accelerate', 'quarterly')}
              >
                <div className="absolute -top-2 -right-2 px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-bold">
                  {plan.quarterly.savings} OFF
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-lg text-gray-900">Quarterly</div>
                    <div className="text-2xl font-black text-purple-600">
                      ${plan.quarterly.price}/3mo
                    </div>
                    <div className="text-sm text-gray-500">
                      ${(plan.quarterly.price / 3).toFixed(0)}/mo
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors">
                    Select
                  </button>
                </div>
              </div>

              <div
                className="p-4 rounded-2xl border-2 border-purple-500 hover:border-purple-600 cursor-pointer transition-colors relative bg-gradient-to-br from-purple-50 to-pink-50"
                onClick={() => handleSelectPlan(key as 'learn' | 'accelerate', 'yearly')}
              >
                <div className="absolute -top-2 -right-2 px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-bold">
                  {plan.yearly.savings} OFF
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-lg text-gray-900">Yearly</div>
                    <div className="text-2xl font-black text-purple-600">
                      ${plan.yearly.price}/yr
                    </div>
                    <div className="text-sm text-gray-500">
                      ${(plan.yearly.price / 12).toFixed(0)}/mo
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-colors">
                    Best Value
                  </button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h4 className="font-bold text-lg text-gray-900 mb-4">What's Included:</h4>
              <div className="space-y-2">
                <FeatureItem label="Course Lessons" included={plan.features.courseLessons} />
                <FeatureItem label="Resources" included={plan.features.resources} />
                <FeatureItem
                  label="Product Portfolio Template"
                  included={plan.features.productPortfolioTemplate}
                />
                <FeatureItem
                  label="PM Emails Discovered"
                  value={plan.features.pmEmailsDiscovered}
                />
                <FeatureItem
                  label="Outreach Messages Created"
                  value={plan.features.outreachMessagesCreated}
                />
                <FeatureItem
                  label="Resume Bullet Optimizations"
                  value={plan.features.resumeBulletOptimizations}
                />
                <FeatureItem
                  label="Resume Customizations for Jobs"
                  value={plan.features.resumeCustomizationsForJobs}
                />
                <FeatureItem
                  label="Product Portfolio Case Study Ideas"
                  value={plan.features.productPortfolioCaseStudyIdeas}
                />
                <FeatureItem label="Jobs Tracked" value={plan.features.jobsTracked} />
                <FeatureItem
                  label="Custom Questions for Interviewers"
                  value={plan.features.customQuestionsForInterviewers}
                />
                <FeatureItem
                  label="Automated Company Research Searches"
                  value={plan.features.automatedCompanyResearchSearches}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FeatureItem = ({
  label,
  included,
  value,
}: {
  label: string;
  included?: boolean;
  value?: number | typeof Infinity;
}) => {
  if (included !== undefined) {
    return (
      <div className="flex items-center gap-2">
        {included ? (
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
        ) : (
          <span className="w-5 h-5 text-gray-400 flex-shrink-0">✕</span>
        )}
        <span className={included ? 'text-gray-900' : 'text-gray-400 line-through'}>
          {label}
        </span>
      </div>
    );
  }

  if (value !== undefined) {
    const displayValue = value === Infinity ? 'Unlimited' : value.toString();
    return (
      <div className="flex items-center gap-2">
        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
        <span className="text-gray-900">
          {label}: <span className="font-bold">{displayValue}</span>
        </span>
      </div>
    );
  }

  return null;
};

