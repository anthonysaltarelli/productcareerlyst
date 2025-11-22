'use client';

import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';

const plans = {
  learn: {
    name: 'Learn',
    description: 'Perfect for getting started',
    popular: false,
    monthly: { price: 12, priceId: 'price_learn_monthly_12' },
    quarterly: { price: 27, priceId: 'price_learn_quarterly_27', savings: '25%' },
    yearly: { price: 84, priceId: 'price_learn_yearly_84', savings: '42%' },
    features: {
      courseLessons: true,
      resources: true,
      productPortfolioTemplate: false,
      pmEmailsDiscovered: false,
      outreachMessagesCreated: false,
      resumeBulletOptimizations: false,
      resumeCustomizationsForJobs: false,
      productPortfolioCaseStudyIdeas: false,
      jobsTracked: false,
      customQuestionsForInterviewers: false,
      automatedCompanyResearchSearches: false,
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

const featureList = [
  { key: 'courseLessons', label: 'Course Lessons' },
  { key: 'resources', label: 'Resources' },
  { key: 'productPortfolioTemplate', label: 'Product Portfolio Template' },
  { key: 'pmEmailsDiscovered', label: 'PM Emails Discovered' },
  { key: 'outreachMessagesCreated', label: 'Outreach Messages Created' },
  { key: 'resumeBulletOptimizations', label: 'Resume Bullet Optimizations' },
  { key: 'resumeCustomizationsForJobs', label: 'Resume Customizations for Jobs' },
  { key: 'productPortfolioCaseStudyIdeas', label: 'Product Portfolio Case Study Ideas' },
  { key: 'jobsTracked', label: 'Jobs Tracked' },
  { key: 'customQuestionsForInterviewers', label: 'Custom Questions for Interviewers' },
  { key: 'automatedCompanyResearchSearches', label: 'Automated Company Research Searches' },
];

export const PlanComparison = () => {
  const router = useRouter();

  const handleContinue = (plan: 'learn' | 'accelerate') => {
    router.push(`/dashboard/billing/select-billing?plan=${plan}`);
  };

  const acceleratePlan = plans.accelerate;
  const learnPlan = plans.learn;
  const accelerateMonthlyPriceFromYearly = acceleratePlan.yearly.price / 12;
  const learnMonthlyPriceFromYearly = learnPlan.yearly.price / 12;

  const getFeatureValue = (plan: typeof acceleratePlan | typeof learnPlan, featureKey: string) => {
    const feature = plan.features[featureKey as keyof typeof plan.features];
    if (feature === true) return 'included';
    if (feature === false) return 'not-included';
    if (feature === Infinity) return 'unlimited';
    return 'not-included';
  };

  return (
    <div className="space-y-8">
      {/* Plan Headers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Empty header for features column */}
        <div></div>
        
        {/* Accelerate Plan Header */}
        <div className="relative p-6 rounded-[2.5rem] bg-white shadow-lg border-2 border-purple-500 ring-4 ring-purple-200">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold">
              MOST POPULAR
            </span>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-black text-gray-900 mb-2">{acceleratePlan.name}</h3>
            <p className="text-gray-600 font-semibold mb-4">{acceleratePlan.description}</p>
            <div className="text-4xl font-black text-purple-600 mb-2">
              ${accelerateMonthlyPriceFromYearly.toFixed(0)}/mo
            </div>
            <div className="text-sm text-gray-600 font-semibold mb-6">
              Save 40% annually
            </div>
            <button
              onClick={() => handleContinue('accelerate')}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Continue
            </button>
          </div>
        </div>

        {/* Learn Plan Header */}
        <div className="relative p-6 rounded-[2.5rem] bg-white shadow-lg border-2 border-gray-200">
          <div className="text-center">
            <h3 className="text-3xl font-black text-gray-900 mb-2">{learnPlan.name}</h3>
            <p className="text-gray-600 font-semibold mb-4">{learnPlan.description}</p>
            <div className="text-4xl font-black text-purple-600 mb-2">
              ${learnMonthlyPriceFromYearly.toFixed(0)}/mo
            </div>
            <div className="text-sm text-gray-600 font-semibold mb-6">
              Save 42% annually
            </div>
            <button
              onClick={() => handleContinue('learn')}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="divide-y-2 divide-gray-200">
          {featureList.map((feature) => {
            const accelerateValue = getFeatureValue(acceleratePlan, feature.key);
            const learnValue = getFeatureValue(learnPlan, feature.key);

            return (
              <div key={feature.key} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 hover:bg-gray-50 transition-colors">
                {/* Feature Name - Left */}
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-900">{feature.label}</span>
                </div>

                {/* Accelerate Plan Value */}
                <div className="flex items-center justify-center">
                  {accelerateValue === 'included' && (
                    <Check className="w-6 h-6 text-green-600" />
                  )}
                  {accelerateValue === 'unlimited' && (
                    <span className="text-lg font-black text-purple-600">Unlimited</span>
                  )}
                  {accelerateValue === 'not-included' && (
                    <X className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Learn Plan Value */}
                <div className="flex items-center justify-center">
                  {learnValue === 'included' && (
                    <Check className="w-6 h-6 text-green-600" />
                  )}
                  {learnValue === 'not-included' && (
                    <X className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


