'use client';

import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { TrackedButton } from '@/app/components/TrackedButton';
import { trackEvent } from '@/lib/amplitude/client';

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
  { key: 'productPortfolioTemplate', label: 'Hosted Product Portfolio' },
  { key: 'pmEmailsDiscovered', label: 'PM Emails Discovered' },
  { key: 'outreachMessagesCreated', label: 'Outreach Messages Created' },
  { key: 'resumeBulletOptimizations', label: 'Resume Bullet Optimizations' },
  { key: 'resumeCustomizationsForJobs', label: 'Resume Customizations for Jobs' },
  { key: 'productPortfolioCaseStudyIdeas', label: 'Product Portfolio Case Study Ideas' },
  { key: 'jobsTracked', label: 'Jobs Tracked' },
  { key: 'customQuestionsForInterviewers', label: 'Custom Questions for Interviewers' },
  { key: 'automatedCompanyResearchSearches', label: 'Automated Company Research Searches' },
];

interface PlanComparisonProps {
  hideContinueButtons?: boolean;
}

export const PlanComparison = ({ hideContinueButtons = false }: PlanComparisonProps) => {
  const router = useRouter();

  // Determine which page we're on
  const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/dashboard/billing';
  const isBillingPage = pageRoute === '/dashboard/billing';
  const isPlansPage = pageRoute === '/dashboard/billing/plans';
  const pagePrefix = isBillingPage ? 'billing-page' : isPlansPage ? 'plans-page' : 'plan-comparison';

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

  const handleContinue = (plan: 'learn' | 'accelerate') => {
    router.push(`/dashboard/billing/select-billing?plan=${plan}`);
  };

  const handleFeatureRowClick = (feature: typeof featureList[0], rowIndex: number) => {
    const accelerateValue = getFeatureValue(plans.accelerate, feature.key);
    const learnValue = getFeatureValue(plans.learn, feature.key);
    
    trackEvent('User Clicked Feature Comparison Row', {
      'Button Section': 'Feature Comparison Table',
      'Feature Name': feature.label,
      'Feature Key': feature.key,
      'Learn Plan Value': learnValue,
      'Accelerate Plan Value': accelerateValue,
      'Row Position': rowIndex + 1,
    });
  };

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Plan Cards at the Top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
        {/* Learn Plan Card */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200 p-5 md:p-8 flex flex-col hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(0,0,0,0.1)] md:hover:shadow-[0_8px_0_0_rgba(0,0,0,0.1)] transition-all duration-200 cursor-pointer">
          <div className="text-center flex-grow flex flex-col">
            <div>
              <h3 className="text-3xl font-black text-gray-900 mb-2">{learnPlan.name}</h3>
              <p className="text-gray-600 font-semibold mb-4">{learnPlan.description}</p>
              <div className="text-4xl font-black text-purple-600 mb-2">
                ${learnMonthlyPriceFromYearly.toFixed(0)}/mo
              </div>
              <div className="text-sm text-gray-600 font-semibold mb-6">
                Save 40% annually
              </div>
              <div className="text-left mb-6 space-y-2">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Kickstart your PM career with...</p>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">PM Course Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">PM Resources</span>
                </div>
              </div>
            </div>
            {!hideContinueButtons && (
              <div className="mt-auto">
                <TrackedButton
                  onClick={() => handleContinue('learn')}
                  buttonId={`${pagePrefix}-no-sub-plan-learn-card`}
                  eventName="User Clicked Plan Card"
                  eventProperties={{
                    'Button Section': 'Plan Comparison Section',
                    'Button Position': 'Learn Plan Card',
                    'Button Text': 'Continue',
                    'Plan Selected': 'learn',
                    'Plan Price Display': `$${learnMonthlyPriceFromYearly.toFixed(0)}/mo`,
                    'Plan Savings Display': 'Save 40% annually',
                    'User State': 'no_subscription',
                    'Page Section': 'Above the fold',
                    'Card Position': 'First Plan Card',
                    'Card Highlighted': false,
                  }}
                  className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-[0_8px_0_0_rgba(147,51,234,0.5)] hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.5)]"
                >
                  Continue
                </TrackedButton>
              </div>
            )}
          </div>
        </div>

        {/* Accelerate Plan Card */}
        <div className="relative bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_8px_0_0_rgba(147,51,234,0.3)] md:shadow-[0_12px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-500 p-5 md:p-8 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.3)] md:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.3)] transition-all duration-200 cursor-pointer">
          {acceleratePlan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold shadow-[0_6px_0_0_rgba(147,51,234,0.4)]">
                MOST POPULAR
              </span>
            </div>
          )}
          <div className="text-center">
            <h3 className="text-3xl font-black text-gray-900 mb-2">{acceleratePlan.name}</h3>
            <p className="text-gray-600 font-semibold mb-4">{acceleratePlan.description}</p>
            <div className="text-4xl font-black text-purple-600 mb-2">
              ${accelerateMonthlyPriceFromYearly.toFixed(0)}/mo
            </div>
            <div className="text-sm text-gray-600 font-semibold mb-6">
              Save 40% annually
            </div>
            <div className="text-left mb-6 space-y-2">
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Everything in Learn plus...</p>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">Unlimited Customized Resumes</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">Unlimited Networking Contacts Discovered</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">Custom Product Portfolio</span>
              </div>
              <div className="mt-2">
                <p className="text-sm font-semibold text-gray-500 italic">+ more</p>
              </div>
            </div>
            {!hideContinueButtons && (
              <TrackedButton
                onClick={() => handleContinue('accelerate')}
                buttonId={`${pagePrefix}-no-sub-plan-accelerate-card`}
                eventName="User Clicked Plan Card"
                eventProperties={{
                  'Button Section': 'Plan Comparison Section',
                  'Button Position': 'Accelerate Plan Card',
                  'Button Text': 'Continue',
                  'Plan Selected': 'accelerate',
                  'Plan Price Display': `$${accelerateMonthlyPriceFromYearly.toFixed(0)}/mo`,
                  'Plan Savings Display': 'Save 40% annually',
                  'User State': 'no_subscription',
                  'Page Section': 'Above the fold',
                  'Card Position': 'Second Plan Card',
                  'Card Highlighted': true,
                }}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-[0_8px_0_0_rgba(147,51,234,0.5)] hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.5)]"
              >
                Continue
              </TrackedButton>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table Below */}
      <div className="max-w-4xl mx-auto bg-white rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden p-3 md:p-8 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
        <div className="overflow-x-auto -mx-1 md:mx-0">
          <table className="w-full border-collapse min-w-[320px]">
          <thead>
            <tr>
              <th className="text-left py-3 md:py-4 px-2 md:px-6 font-bold text-sm md:text-lg text-gray-900 w-[45%] md:w-[40%]">
                Features
              </th>
              <th className="text-center py-3 md:py-4 px-1 md:px-6 font-bold text-sm md:text-lg text-gray-900 w-[27.5%] md:w-[30%]">
                {learnPlan.name}
              </th>
              <th className="text-center py-3 md:py-4 px-1 md:px-6 font-bold text-sm md:text-lg text-purple-600 w-[27.5%] md:w-[30%]">
                {acceleratePlan.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {featureList.map((feature, index) => {
              const accelerateValue = getFeatureValue(acceleratePlan, feature.key);
              const learnValue = getFeatureValue(learnPlan, feature.key);

              return (
                <tr
                  key={feature.key}
                  className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleFeatureRowClick(feature, index)}
                >
                  <td className="py-2.5 md:py-3 px-2 md:px-6 font-semibold text-xs md:text-sm text-gray-900">
                    {feature.label}
                  </td>
                  <td className="py-2.5 md:py-3 px-1 md:px-6 text-center">
                    {learnValue === 'included' && (
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 mx-auto" />
                    )}
                    {learnValue === 'not-included' && (
                      <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mx-auto" strokeWidth={2.5} />
                    )}
                  </td>
                  <td className="py-2.5 md:py-3 px-1 md:px-6 text-center">
                    {accelerateValue === 'included' && (
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 mx-auto" />
                    )}
                    {accelerateValue === 'unlimited' && (
                      <span className="text-xs md:text-sm font-bold text-purple-600">Unlimited</span>
                    )}
                    {accelerateValue === 'not-included' && (
                      <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mx-auto" strokeWidth={2.5} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};


