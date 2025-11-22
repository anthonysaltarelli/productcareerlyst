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
    <div className="space-y-12">
      {/* Plan Cards at the Top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Learn Plan Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-gray-200 p-8 flex flex-col">
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
            <div className="mt-auto">
              <button
                onClick={() => handleContinue('learn')}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        {/* Accelerate Plan Card */}
        <div className="relative bg-white rounded-[2.5rem] shadow-xl border-2 border-purple-500 p-8">
          {acceleratePlan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold shadow-lg">
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
            <button
              onClick={() => handleContinue('accelerate')}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table Below */}
      <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] overflow-hidden p-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '30%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="text-left py-4 px-6 font-bold text-base text-gray-900">
                Features
              </th>
              <th className="text-center py-4 px-6 font-bold text-base text-gray-900">
                {learnPlan.name}
              </th>
              <th className="text-center py-4 px-6 font-bold text-base text-gray-900">
                {acceleratePlan.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {featureList.map((feature) => {
              const accelerateValue = getFeatureValue(acceleratePlan, feature.key);
              const learnValue = getFeatureValue(learnPlan, feature.key);

              return (
                <tr key={feature.key}>
                  <td className="py-3 px-6 font-bold text-sm text-gray-900">
                    {feature.label}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {learnValue === 'included' && (
                      <span className="text-gray-900 font-bold">✓</span>
                    )}
                    {learnValue === 'not-included' && (
                      <div className="flex justify-center items-center">
                        <X className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {accelerateValue === 'included' && (
                      <span className="text-gray-900 font-bold">✓</span>
                    )}
                    {accelerateValue === 'unlimited' && (
                      <span className="text-sm font-bold text-gray-900">Unlimited</span>
                    )}
                    {accelerateValue === 'not-included' && (
                      <div className="flex justify-center items-center">
                        <X className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                      </div>
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


