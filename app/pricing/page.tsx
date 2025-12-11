'use client';

import { useState, useEffect } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { TrackedButton } from '@/app/components/TrackedButton';
import { PageTracking } from '@/app/components/PageTracking';
import { trackEvent } from '@/lib/amplitude/client';
import { useFlags } from 'launchdarkly-react-client-sdk';

type BillingPeriod = 'monthly' | 'quarterly' | 'yearly';

// Black Friday deal configuration
const BLACK_FRIDAY_END_DATE = new Date('2025-12-02T04:59:59Z'); // Dec 1st 11:59pm EST = Dec 2nd 04:59:59 UTC
const BLACK_FRIDAY_DISCOUNT = 0.5; // 50% off

interface FeatureInfo {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const plans = {
  learn: {
    name: 'Learn',
    description: 'Perfect for getting started with fundamentals',
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
    description: 'Unlimited everything for serious career growth',
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

const featureList: FeatureInfo[] = [
  { 
    key: 'courseLessons', 
    label: 'Course Lessons',
    description: 'Access our comprehensive library of 120+ video lessons across 7 courses covering PM fundamentals, interview mastery, and career advancement. Learn from real-world examples and actionable frameworks.',
    icon: '📚',
  },
  { 
    key: 'resources', 
    label: 'PM Resources & Templates',
    description: '20+ battle-tested PM templates including PRDs, roadmaps, OKR frameworks, and prioritization matrices. These are the same templates used by PMs at top tech companies.',
    icon: '⚡',
  },
  { 
    key: 'productPortfolioTemplate', 
    label: 'Hosted Product Portfolio',
    description: 'Create a stunning portfolio website at productcareerlyst.com/p/yourname. Showcase your product work with rich case studies, custom styling, and SEO optimization to stand out from 99% of candidates.',
    icon: '🎨',
  },
  { 
    key: 'pmEmailsDiscovered', 
    label: 'PM Emails Discovered',
    description: 'Our AI discovers verified email addresses for product managers at your target companies. Build a targeted networking list and reach out directly to decision-makers who can refer you.',
    icon: '📧',
  },
  { 
    key: 'outreachMessagesCreated', 
    label: 'Outreach Messages Created',
    description: 'Generate personalized, compelling outreach messages for networking and referral requests. Our AI crafts messages that get responses, not ignored.',
    icon: '✉️',
  },
  { 
    key: 'resumeBulletOptimizations', 
    label: 'Resume Bullet Optimizations',
    description: 'Transform weak resume bullets into impactful, metrics-driven statements. Our AI analyzes your experience and rewrites bullets to highlight your product impact using the XYZ formula.',
    icon: '📄',
  },
  { 
    key: 'resumeCustomizationsForJobs', 
    label: 'Resume Customizations for Jobs',
    description: 'Automatically tailor your resume for specific job postings. Our AI analyzes job descriptions and adjusts your resume keywords, skills, and experience highlights for maximum ATS compatibility.',
    icon: '🎯',
  },
  { 
    key: 'productPortfolioCaseStudyIdeas', 
    label: 'Portfolio Case Study Ideas',
    description: 'Get AI-generated case study ideas based on your experience. Turn your product work into compelling narratives that demonstrate your strategic thinking and impact.',
    icon: '💡',
  },
  { 
    key: 'jobsTracked', 
    label: 'Jobs Tracked',
    description: 'Track all your job applications in one place with our Kanban board. Monitor application status, interview stages, and follow-ups. Never lose track of an opportunity again.',
    icon: '💼',
  },
  { 
    key: 'customQuestionsForInterviewers', 
    label: 'Custom Interview Questions',
    description: 'Generate thoughtful, company-specific questions to ask your interviewers. Show genuine interest and strategic thinking that leaves a lasting impression.',
    icon: '🤔',
  },
  { 
    key: 'automatedCompanyResearchSearches', 
    label: 'Automated Company Research',
    description: 'Get instant, AI-powered research on any company. Understand their product strategy, competitive landscape, recent news, and culture before your interview.',
    icon: '🔍',
  },
];

const testimonials = [
  {
    content: "Super helpful along the way. Finding a product role is hard in this market but product careerlyst made it super easy to keep track and helped me find an in that eventually got me my offer. highly recommend the videos included too which were great for case study prepping.",
    author: "Shreenath Bhanderi",
  },
  {
    content: "Product Careerlyst has been an absolute game-changer in my product management journey. As someone transitioning into product management, I was looking for a comprehensive resource that went beyond theoretical concepts, and this platform delivered exactly that. What sets Product Careerlyst apart is Anthony's thoughtful approach to product education. You can tell it's built by a seasoned PM who understands exactly what aspiring product managers need.",
    author: "Sharad",
  },
  {
    content: "Product Careerlyst is a game-changer. If you're really looking for something that'll boost your chance to find your next product gig, this is it. The dashboard is super user-friendly and streamlines your job search, and the resources are well-organized. Some of the content are stuff that you see on a daily basis in product/tech companies, so it really gave me an edge during interviews. I found a job in Product Ops thanks to PC - so definitely recommend if you're on the fence!",
    author: "Peter",
  },
  {
    content: "I'm currently taking Anthony's course and really enjoying it! The material is engaging, and I've learned a lot about how to search for jobs effectively. Anthony explains the content in a clear and easy-to-understand way. I'm looking forward to revisiting the videos as I continue my job search. I recommend this course to anyone looking to improve their job-hunting skills!",
    author: "Solomon S.",
  },
  {
    content: "Finally an AI enabled tool for Product Managers to find a job in this tough market. I started with the base plan and expanded out to to premium model. The features related to resume optimization and portfolio creation have been very useful. When I first transitioned to PM it was very hard to find information that encompasses all the hats a PM wears. The resources from this tool has helped me become a better product manager and have greatly helped me as I got through interview processes.",
    author: "Ken Patel",
  },
  {
    content: "Anthony is a product wizard. Whenever I have questions about my career I go to his content. I've spent so much time searching for resources to help - YouTube, blogs, etc - nothing compares to Anthony's expertise. Thank you Anthony, my career wouldn't be same without you!",
    author: "Alex",
  },
];

const FeatureModal = ({ 
  feature, 
  onClose 
}: { 
  feature: FeatureInfo; 
  onClose: () => void;
}) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block">{feature.icon}</span>
          <h3 className="text-2xl font-black text-gray-900">{feature.label}</h3>
        </div>
        
        <p className="text-gray-700 font-medium text-base leading-relaxed">
          {feature.description}
        </p>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <TrackedButton
            onClick={onClose}
            buttonId="pricing-feature-modal-close"
            eventName="User Closed Feature Modal"
            eventProperties={{
              'Feature Name': feature.label,
              'Feature Key': feature.key,
            }}
            className="w-full px-6 py-3 rounded-[1.5rem] bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-[0_6px_0_0_rgba(147,51,234,0.5)] hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.5)]"
          >
            Got it!
          </TrackedButton>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate time remaining until Black Friday ends
interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const calculateTimeRemaining = (): TimeRemaining | null => {
  const now = new Date();
  const difference = BLACK_FRIDAY_END_DATE.getTime() - now.getTime();
  
  if (difference <= 0) {
    return null;
  }
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
};

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
  const [selectedFeature, setSelectedFeature] = useState<FeatureInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Feature flags
  const flags = useFlags();
  const blackFridayEnabled = flags['blackFriday2025'] ?? false;
  
  // Check if Black Friday deal is active (feature flag + date check)
  const isBlackFridayActive = isClient && blackFridayEnabled && timeRemaining !== null;
  
  // Update countdown timer
  useEffect(() => {
    setIsClient(true);
    setTimeRemaining(calculateTimeRemaining());
    
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Track Black Friday deal view
  useEffect(() => {
    if (isBlackFridayActive && timeRemaining) {
      trackEvent('User Viewed Black Friday Deal', {
        'Page': 'Pricing',
        'Days Remaining': timeRemaining.days,
        'Hours Remaining': timeRemaining.hours,
        'Feature Flag Enabled': blackFridayEnabled,
      });
    }
  }, [isBlackFridayActive]); // Only track once when Black Friday becomes active

  // Calculate Black Friday price (50% off the already discounted price)
  const getBlackFridayPrice = (originalPrice: number) => {
    return Math.round(originalPrice * (1 - BLACK_FRIDAY_DISCOUNT));
  };

  const getMonthlyEquivalent = (plan: typeof plans.learn | typeof plans.accelerate) => {
    let basePrice: number;
    switch (billingPeriod) {
      case 'monthly':
        if (isBlackFridayActive) {
          return getBlackFridayPrice(plan.monthly.price);
        }
        return plan.monthly.price;
      case 'quarterly':
        basePrice = plan.quarterly.price;
        if (isBlackFridayActive) {
          return Math.round(getBlackFridayPrice(basePrice) / 3);
        }
        return Math.round(basePrice / 3);
      case 'yearly':
        basePrice = plan.yearly.price;
        if (isBlackFridayActive) {
          return Math.round(getBlackFridayPrice(basePrice) / 12);
        }
        return Math.round(basePrice / 12);
    }
  };

  const getTotalPrice = (plan: typeof plans.learn | typeof plans.accelerate) => {
    switch (billingPeriod) {
      case 'monthly':
        if (isBlackFridayActive) {
          return getBlackFridayPrice(plan.monthly.price);
        }
        return plan.monthly.price;
      case 'quarterly':
        if (isBlackFridayActive) {
          return getBlackFridayPrice(plan.quarterly.price);
        }
        return plan.quarterly.price;
      case 'yearly':
        if (isBlackFridayActive) {
          return getBlackFridayPrice(plan.yearly.price);
        }
        return plan.yearly.price;
    }
  };

  const getOriginalTotalPrice = (plan: typeof plans.learn | typeof plans.accelerate) => {
    switch (billingPeriod) {
      case 'monthly':
        return plan.monthly.price;
      case 'quarterly':
        return plan.quarterly.price;
      case 'yearly':
        return plan.yearly.price;
    }
  };

  const getSavingsText = (plan: typeof plans.learn | typeof plans.accelerate) => {
    if (isBlackFridayActive) {
      // For monthly with Black Friday, just show 50%
      if (billingPeriod === 'monthly') {
        return '50%';
      }
      // Calculate total savings with Black Friday for quarterly/yearly
      const monthlyAnnualized = plan.monthly.price * (billingPeriod === 'yearly' ? 12 : 3);
      const finalPrice = getTotalPrice(plan);
      const savingsPercent = Math.round((1 - finalPrice / monthlyAnnualized) * 100);
      return `${savingsPercent}%`;
    }
    
    switch (billingPeriod) {
      case 'quarterly':
        return plan.quarterly.savings;
      case 'yearly':
        return plan.yearly.savings;
      default:
        return null;
    }
  };

  const getFeatureValue = (plan: typeof plans.accelerate | typeof plans.learn, featureKey: string) => {
    const feature = plan.features[featureKey as keyof typeof plan.features];
    if (feature === true) return 'included';
    if (feature === false) return 'not-included';
    if (feature === Infinity) return 'unlimited';
    return 'not-included';
  };

  const handleBillingPeriodChange = (period: BillingPeriod) => {
    setBillingPeriod(period);
    trackEvent('User Changed Billing Period', {
      'New Period': period,
      'Page': 'Pricing',
    });
  };

  const handleFeatureClick = (feature: FeatureInfo) => {
    setSelectedFeature(feature);
    trackEvent('User Opened Feature Modal', {
      'Feature Name': feature.label,
      'Feature Key': feature.key,
      'Page': 'Pricing',
    });
  };

  const handlePlanSelect = (planName: string) => {
    trackEvent('User Clicked Plan CTA', {
      'Plan Name': planName,
      'Billing Period': billingPeriod,
      'Monthly Equivalent': planName === 'learn' 
        ? getMonthlyEquivalent(plans.learn) 
        : getMonthlyEquivalent(plans.accelerate),
      'Total Price': planName === 'learn' 
        ? getTotalPrice(plans.learn) 
        : getTotalPrice(plans.accelerate),
      'Page': 'Pricing',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <PageTracking pageName="Pricing" />
        
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 md:py-16">
          {/* Hero Section */}
          <div className="text-center mb-10 sm:mb-16">
            {/* Regular savings badge - only show when Black Friday is NOT active */}
            {!isBlackFridayActive && (
              <div className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-purple-300 shadow-lg">
                  <span className="text-xs sm:text-sm font-bold text-purple-700">
                    💰 Save up to 40% with annual billing
                  </span>
                </div>
              </div>
            )}
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-3 sm:mb-4 px-2 pb-1 leading-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-semibold max-w-2xl mx-auto px-2 mb-6">
              Choose the plan that accelerates your product management career. No hidden fees. Cancel anytime.
            </p>
            
            {/* Black Friday section - Badge + Countdown Timer */}
            {isBlackFridayActive && timeRemaining && (
              <div className="flex flex-col items-center gap-4 sm:gap-6">
                {/* Black Friday Badge */}
                <div className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-black border-2 border-gray-700 shadow-[0_4px_0_0_rgba(0,0,0,0.5)]">
                  <span className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    BLACK FRIDAY: Save 50% off forever on any plan
                  </span>
                </div>
                
                {/* Limited Spots Text */}
                <p className="text-red-600 font-bold text-sm sm:text-base uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Limited Spots Remaining — Our Prices Increase In
                </p>
                
                {/* Countdown Timer */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <div className="text-center">
                    <div className="bg-slate-800 rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[3.5rem] sm:min-w-[4rem] shadow-lg">
                      <span className="text-white font-black text-2xl sm:text-3xl">{String(timeRemaining.days).padStart(2, '0')}</span>
                    </div>
                    <span className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase mt-1.5 block">Days</span>
                  </div>
                  <span className="text-slate-800 font-bold text-2xl sm:text-3xl -mt-4">:</span>
                  <div className="text-center">
                    <div className="bg-slate-800 rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[3.5rem] sm:min-w-[4rem] shadow-lg">
                      <span className="text-white font-black text-2xl sm:text-3xl">{String(timeRemaining.hours).padStart(2, '0')}</span>
                    </div>
                    <span className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase mt-1.5 block">Hours</span>
                  </div>
                  <span className="text-slate-800 font-bold text-2xl sm:text-3xl -mt-4">:</span>
                  <div className="text-center">
                    <div className="bg-slate-800 rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[3.5rem] sm:min-w-[4rem] shadow-lg">
                      <span className="text-white font-black text-2xl sm:text-3xl">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                    </div>
                    <span className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase mt-1.5 block">Mins</span>
                  </div>
                  <span className="text-slate-800 font-bold text-2xl sm:text-3xl -mt-4">:</span>
                  <div className="text-center">
                    <div className="bg-slate-800 rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[3.5rem] sm:min-w-[4rem] shadow-lg">
                      <span className="text-white font-black text-2xl sm:text-3xl">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                    </div>
                    <span className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase mt-1.5 block">Secs</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="inline-flex p-1.5 rounded-[1.5rem] bg-white/80 backdrop-blur-sm border-2 border-purple-200 shadow-lg">
            {(['monthly', 'quarterly', 'yearly'] as BillingPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => handleBillingPeriodChange(period)}
                className={`
                  px-4 sm:px-6 py-2.5 sm:py-3 rounded-[1.25rem] font-bold text-sm sm:text-base transition-all duration-200
                  ${billingPeriod === period 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_4px_0_0_rgba(147,51,234,0.5)]' 
                    : 'text-gray-600 hover:text-purple-600'}
                `}
              >
                {period === 'monthly' && 'Monthly'}
                {period === 'quarterly' && 'Quarterly'}
                {period === 'yearly' && (
                  <span className="flex items-center gap-1.5">
                    Yearly
                    <span className="px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-green-500 text-white font-bold">
                      40% off
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12 sm:mb-16">
          {/* Learn Plan */}
          <div className="relative bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_10px_0_0_rgba(0,0,0,0.1)] sm:shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200 p-6 sm:p-8 flex flex-col hover:translate-y-1 hover:shadow-[0_6px_0_0_rgba(0,0,0,0.1)] sm:hover:shadow-[0_8px_0_0_rgba(0,0,0,0.1)] transition-all duration-200">
            <div className="text-center flex-grow flex flex-col">
              <div>
                <span className="text-4xl mb-2 block">📚</span>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">{plans.learn.name}</h3>
                <p className="text-gray-600 font-semibold mb-4 text-sm sm:text-base">{plans.learn.description}</p>
                
                <div className="text-4xl sm:text-5xl font-black text-purple-600 mb-1">
                  ${getMonthlyEquivalent(plans.learn)}<span className="text-lg sm:text-xl font-bold text-gray-500">/mo</span>
                </div>
                
                {(billingPeriod !== 'monthly' || isBlackFridayActive) && (
                  <div className="text-sm font-semibold mb-2 flex items-center justify-center gap-2">
                    {isBlackFridayActive && (
                      <span className="text-gray-400 line-through">${getOriginalTotalPrice(plans.learn)}</span>
                    )}
                    <span className={isBlackFridayActive ? 'text-red-600' : 'text-gray-600'}>
                      ${getTotalPrice(plans.learn)} billed {billingPeriod}
                    </span>
                  </div>
                )}
                
                {isBlackFridayActive ? (() => {
                  const multiplier = billingPeriod === 'yearly' ? 12 : billingPeriod === 'quarterly' ? 3 : 1;
                  const monthlyTotal = plans.learn.monthly.price * multiplier;
                  const bfPrice = getTotalPrice(plans.learn);
                  const savingsAmount = monthlyTotal - bfPrice;
                  const savingsPercent = Math.round((savingsAmount / monthlyTotal) * 100);
                  return (
                    <div className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 mb-6">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Total Savings</p>
                      <p className="text-2xl font-black text-lime-400">-${savingsAmount}</p>
                      <p className="text-xs font-semibold text-gray-400 mt-1">
                        {savingsPercent}% off vs monthly pricing
                      </p>
                    </div>
                  );
                })() : getSavingsText(plans.learn) && (
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-6 bg-green-100 text-green-700">
                    Save {getSavingsText(plans.learn)}
                  </div>
                )}
                
                {billingPeriod === 'monthly' && !isBlackFridayActive && <div className="mb-6" />}
                
                <div className="text-left mb-6 space-y-2">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Kickstart your PM career with...</p>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-700">120+ PM Course Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-700">20+ PM Resources & Templates</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto">
                <TrackedButton
                  href="/auth/sign-up?plan=learn"
                  buttonId="pricing-learn-plan-cta"
                  eventName="User Clicked Plan CTA"
                  eventProperties={{
                    'Button Section': 'Pricing Page Plan Cards',
                    'Button Position': 'Learn Plan Card',
                    'Button Text': 'Try for Free',
                    'Plan Selected': 'learn',
                    'Billing Period': billingPeriod,
                    'Monthly Equivalent': getMonthlyEquivalent(plans.learn),
                    'Total Price': getTotalPrice(plans.learn),
                    'Original Price': getOriginalTotalPrice(plans.learn),
                    'Black Friday Active': isBlackFridayActive,
                    'Black Friday Discount Applied': isBlackFridayActive,
                  }}
                  onClick={() => handlePlanSelect('learn')}
                  className="w-full px-6 py-3.5 rounded-[1.5rem] bg-white border-2 border-purple-400 text-purple-600 font-black hover:bg-purple-50 transition-all duration-200 shadow-[0_6px_0_0_rgba(147,51,234,0.3)] hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.3)]"
                >
                  Try for Free
                </TrackedButton>
              </div>
            </div>
          </div>

          {/* Accelerate Plan - Most Popular */}
          <div className="relative bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_10px_0_0_rgba(147,51,234,0.3)] sm:shadow-[0_12px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-500 p-6 sm:p-8 hover:translate-y-1 hover:shadow-[0_6px_0_0_rgba(147,51,234,0.3)] sm:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.3)] transition-all duration-200">
            {/* Most Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 sm:px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm font-bold shadow-[0_4px_0_0_rgba(147,51,234,0.4)] sm:shadow-[0_6px_0_0_rgba(147,51,234,0.4)] whitespace-nowrap">
                ⭐ MOST POPULAR
              </span>
            </div>
            
            <div className="text-center pt-2">
              <span className="text-4xl mb-2 block">🚀</span>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">{plans.accelerate.name}</h3>
              <p className="text-gray-600 font-semibold mb-4 text-sm sm:text-base">{plans.accelerate.description}</p>
              
              <div className="text-4xl sm:text-5xl font-black text-purple-600 mb-1">
                ${getMonthlyEquivalent(plans.accelerate)}<span className="text-lg sm:text-xl font-bold text-gray-500">/mo</span>
              </div>
              
              {(billingPeriod !== 'monthly' || isBlackFridayActive) && (
                <div className="text-sm font-semibold mb-2 flex items-center justify-center gap-2">
                  {isBlackFridayActive && (
                    <span className="text-gray-400 line-through">${getOriginalTotalPrice(plans.accelerate)}</span>
                  )}
                  <span className={isBlackFridayActive ? 'text-red-600' : 'text-gray-600'}>
                    ${getTotalPrice(plans.accelerate)} billed {billingPeriod}
                  </span>
                </div>
              )}
              
              {isBlackFridayActive ? (() => {
                const multiplier = billingPeriod === 'yearly' ? 12 : billingPeriod === 'quarterly' ? 3 : 1;
                const monthlyTotal = plans.accelerate.monthly.price * multiplier;
                const bfPrice = getTotalPrice(plans.accelerate);
                const savingsAmount = monthlyTotal - bfPrice;
                const savingsPercent = Math.round((savingsAmount / monthlyTotal) * 100);
                return (
                  <div className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Total Savings</p>
                    <p className="text-2xl font-black text-lime-400">-${savingsAmount}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-1">
                      {savingsPercent}% off vs monthly pricing
                    </p>
                  </div>
                );
              })() : getSavingsText(plans.accelerate) && (
                <div className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-6 bg-green-100 text-green-700">
                  Save {getSavingsText(plans.accelerate)}
                </div>
              )}
              
              {billingPeriod === 'monthly' && !isBlackFridayActive && <div className="mb-6" />}
              
              <div className="text-left mb-6 space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-3">Everything in Learn plus...</p>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">Unlimited Resume Customizations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">Unlimited Networking Contacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">Custom Product Portfolio</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">AI Company Research</span>
                </div>
                <p className="text-sm font-semibold text-gray-500 italic mt-2">+ unlimited AI features</p>
              </div>
              
              <TrackedButton
                href="/auth/sign-up?plan=accelerate"
                buttonId="pricing-accelerate-plan-cta"
                eventName="User Clicked Plan CTA"
                eventProperties={{
                  'Button Section': 'Pricing Page Plan Cards',
                  'Button Position': 'Accelerate Plan Card',
                  'Button Text': 'Try for Free',
                  'Plan Selected': 'accelerate',
                  'Billing Period': billingPeriod,
                  'Monthly Equivalent': getMonthlyEquivalent(plans.accelerate),
                  'Total Price': getTotalPrice(plans.accelerate),
                  'Original Price': getOriginalTotalPrice(plans.accelerate),
                  'Is Most Popular': true,
                  'Black Friday Active': isBlackFridayActive,
                  'Black Friday Discount Applied': isBlackFridayActive,
                }}
                onClick={() => handlePlanSelect('accelerate')}
                className="w-full px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-[0_6px_0_0_rgba(147,51,234,0.5)] hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.5)]"
              >
                Try for Free
              </TrackedButton>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-20">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800 mb-2">
              Compare All Features
            </h2>
            <p className="text-gray-600 font-semibold text-sm sm:text-base">
              Click the <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-600"><Plus className="w-3 h-3" /></span> to learn more about each feature
            </p>
          </div>
          
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden p-4 sm:p-8 shadow-[0_10px_0_0_rgba(0,0,0,0.1)] sm:shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-bold text-base sm:text-lg text-gray-900">
                      Features
                    </th>
                    <th className="text-center py-3 sm:py-4 px-2 sm:px-6 font-bold text-base sm:text-lg text-gray-900 w-24 sm:w-32">
                      Learn
                    </th>
                    <th className="text-center py-3 sm:py-4 px-2 sm:px-6 font-bold text-base sm:text-lg text-purple-600 w-24 sm:w-32">
                      <span className="flex items-center justify-center gap-1">
                        Accelerate
                        <span className="hidden sm:inline text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-bold">★</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureList.map((feature, index) => {
                    const accelerateValue = getFeatureValue(plans.accelerate, feature.key);
                    const learnValue = getFeatureValue(plans.learn, feature.key);

                    return (
                      <tr 
                        key={feature.key} 
                        className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors"
                      >
                        <td className="py-3 sm:py-4 px-3 sm:px-6">
                          <button
                            onClick={() => handleFeatureClick(feature)}
                            className="flex items-center gap-2 sm:gap-3 text-left group w-full cursor-pointer"
                            aria-label={`Learn more about ${feature.label}`}
                          >
                            <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                            </span>
                            <span className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-purple-700 transition-colors">
                              {feature.label}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-6 text-center">
                          {learnValue === 'included' && (
                            <span className="text-green-600 font-bold text-lg">✓</span>
                          )}
                          {learnValue === 'not-included' && (
                            <div className="flex justify-center items-center">
                              <X className="w-5 h-5 text-gray-300" strokeWidth={2.5} />
                            </div>
                          )}
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-6 text-center">
                          {accelerateValue === 'included' && (
                            <span className="text-green-600 font-bold text-lg">✓</span>
                          )}
                          {accelerateValue === 'unlimited' && (
                            <span className="text-xs sm:text-sm font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                              Unlimited
                            </span>
                          )}
                          {accelerateValue === 'not-included' && (
                            <div className="flex justify-center items-center">
                              <X className="w-5 h-5 text-gray-300" strokeWidth={2.5} />
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

        {/* Testimonials Section */}
        <div className="mb-12 sm:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 mb-3 sm:mb-4">
              Loved by Product Managers
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium">
              Real PMs. Real results. Real fast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_8px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_10px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200"
              >
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg sm:text-xl">★</span>
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-700 font-medium mb-3 sm:mb-4 italic line-clamp-6">
                  "{testimonial.content}"
                </p>
                <p className="font-bold text-gray-800 text-sm sm:text-base">— {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-12 sm:mb-20">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800 mb-2">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="p-4 sm:p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                Yes! You can cancel your subscription at any time. Your access will continue until the end of your billing period.
              </p>
            </div>

            <div className="p-4 sm:p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">
                What's the difference between Learn and Accelerate?
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                Learn gives you access to all courses and resources. Accelerate adds unlimited AI-powered features: product portfolio creation, resume optimization, job tracking, company research, and networking tools.
              </p>
            </div>

            <div className="p-4 sm:p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">
                Can I switch plans later?
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                Absolutely! You can upgrade or downgrade your plan at any time, and you can always switch your billing cadence.
              </p>
            </div>

            <div className="p-4 sm:p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.1)] md:shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                We offer a 7-day money-back guarantee if you're not completely satisfied with your purchase. Just reach out to our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_12px_0_0_rgba(15,23,42,0.5)] md:shadow-[0_20px_0_0_rgba(15,23,42,0.5)] border-2 border-slate-700 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6">
            Ready to Level Up Your Career?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 font-medium mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Join thousands of product managers who've accelerated their careers with Product Careerlyst.
          </p>
          <TrackedButton
            href="/auth/sign-up"
            className="inline-block px-8 py-4 sm:px-10 sm:py-5 md:px-14 md:py-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.7)] sm:shadow-[0_8px_0_0_rgba(147,51,234,0.7)] md:shadow-[0_10px_0_0_rgba(147,51,234,0.7)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.7)] sm:hover:shadow-[0_4px_0_0_rgba(147,51,234,0.7)] md:hover:shadow-[0_6px_0_0_rgba(147,51,234,0.7)] text-base sm:text-lg md:text-xl font-black text-white transition-all duration-200 mb-4 sm:mb-6"
            eventName="User Clicked Sign Up Button"
            buttonId="pricing-final-cta"
            eventProperties={{
              'Button Section': 'Pricing Page Final CTA',
              'Button Position': 'Center of Final CTA Card',
              'Button Type': 'Final CTA',
              'Button Text': 'START YOUR FREE TRIAL →',
              'Button Context': 'After pricing table and testimonials',
              'Page Section': 'Below the fold',
            }}
          >
            START YOUR FREE TRIAL →
          </TrackedButton>
        </div>
      </div>

      {/* Feature Modal */}
      {selectedFeature && (
        <FeatureModal
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </div>
  );
}

