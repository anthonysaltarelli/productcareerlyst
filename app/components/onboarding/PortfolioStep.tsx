'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { trackEvent } from '@/lib/amplitude/client';
import { Loader2, CheckCircle, Sparkles, Rocket, Zap, Calendar } from 'lucide-react';
import type { PersonalizedPlan, OnboardingData } from '@/lib/utils/planGenerator';

interface PortfolioStepProps {
  onNext: () => void;
  onBack: () => void;
}

const PORTFOLIO_STATUS_OPTIONS = [
  { value: 'have_portfolio', label: "Yes, I have a portfolio" },
  { value: 'no_portfolio_want_one', label: "No, but I'd like to create one" },
  { value: 'no_portfolio_not_interested', label: "No, and I'm not interested in creating one" },
] as const;

const TRIAL_DAYS = 7;

export const PortfolioStep = ({ onNext, onBack }: PortfolioStepProps) => {
  const router = useRouter();
  const { progress, updateStep, markComplete } = useOnboardingProgress();
  const [hasPortfolio, setHasPortfolio] = useState<string>('');
  const [wantsPortfolio, setWantsPortfolio] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  
  // Finish button states
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishStep, setFinishStep] = useState<'idle' | 'saving' | 'generating' | 'creating_trial' | 'completing' | 'done'>('idle');
  const [trialStartDate, setTrialStartDate] = useState<Date | null>(null);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<PersonalizedPlan | null>(null);

  // Load saved data on mount
  useEffect(() => {
    if (progress?.progress_data?.portfolio) {
      const saved = progress.progress_data.portfolio;
      if (saved.hasPortfolio) {
        setHasPortfolio(saved.hasPortfolio);
        if (saved.hasPortfolio === 'have_portfolio') {
          setWantsPortfolio(null);
        } else if (saved.hasPortfolio === 'no_portfolio_want_one') {
          setWantsPortfolio('yes');
        } else {
          setWantsPortfolio('no');
        }
      }
    }
  }, [progress]);

  // Calculate trial dates
  useEffect(() => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + TRIAL_DAYS);
    setTrialStartDate(start);
    setTrialEndDate(end);
  }, []);

  const canProceed = hasPortfolio !== '';

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!hasPortfolio) missing.push('Portfolio Status');
    return missing;
  };

  const missingFields = getMissingFields();

  const handlePortfolioStatusChange = (value: string) => {
    setHasPortfolio(value);
    if (value === 'have_portfolio') {
      setWantsPortfolio(null);
    } else if (value === 'no_portfolio_want_one') {
      setWantsPortfolio('yes');
    } else {
      setWantsPortfolio('no');
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Build onboarding data from progress
  const buildOnboardingData = (): OnboardingData => {
    const progressData = progress?.progress_data || {};
    return {
      personalInfo: progressData.personal_info,
      goals: progressData.goals,
      portfolio: {
        hasPortfolio,
        wantsPortfolio,
      },
    };
  };

  // Extract weekly goals from plan for saving
  const extractWeeklyGoals = (plan: PersonalizedPlan) => {
    return plan.weeklyGoals.actions.map((action) => ({
      id: action.id,
      label: action.label,
      target: action.target || null,
    }));
  };

  const handleFinish = useCallback(async () => {
    if (!canProceed || isFinishing) return;

    setIsFinishing(true);
    setFinishStep('saving');

    try {
      // Step 1: Save portfolio step data
      const stepData = {
        hasPortfolio,
        wantsPortfolio,
      };
      await updateStep('portfolio', stepData);

      // Track step completion
      trackEvent('Onboarding Step Completed', {
        'Step': 'portfolio',
        'Step Name': 'Portfolio',
        'Has Portfolio': hasPortfolio,
        'Wants Portfolio': wantsPortfolio,
      });

      setFinishStep('generating');

      // Step 2: Generate plan
      const onboardingData = buildOnboardingData();
      const planResponse = await fetch('/api/onboarding/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ onboardingData }),
      });

      if (!planResponse.ok) {
        const errorData = await planResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const planData = await planResponse.json();
      const plan = planData.plan as PersonalizedPlan;
      setGeneratedPlan(plan);

      setFinishStep('creating_trial');

      // Step 3: Save plan and goals
      const weeklyGoals = extractWeeklyGoals(plan);
      const completeResponse = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          confirmedGoals: weeklyGoals,
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json().catch(() => ({}));
        console.error('Error completing onboarding:', errorData);
        // Continue anyway - plan might have been saved
      }

      // Step 4: Create trial subscription (no payment method)
      const trialResponse = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'accelerate',
          billingCadence: 'yearly', // Default to yearly
          trialPeriodDays: TRIAL_DAYS,
          // No paymentMethodId - this creates a trial without payment method
        }),
      });

      if (!trialResponse.ok) {
        const errorData = await trialResponse.json().catch(() => ({}));
        console.error('Error creating trial subscription:', errorData);
        // Continue anyway - user can still access dashboard
      }

      setFinishStep('completing');

      // Step 5: Mark onboarding as complete
      await markComplete();

      // Track completion
      trackEvent('Onboarding Completed', {
        'Page Route': '/onboarding',
        'Final Step': 'portfolio',
        'Has Portfolio': hasPortfolio,
        'Wants Portfolio': wantsPortfolio,
        'Trial Period Days': TRIAL_DAYS,
        'Plan Generated': true,
        'Trial Created': trialResponse.ok,
      });

      setFinishStep('done');

      // Small delay to show success state, then redirect
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('Error finishing onboarding:', error);
      trackEvent('Onboarding Finish Error', {
        'Page Route': '/onboarding',
        'Step': 'portfolio',
        'Error': error instanceof Error ? error.message : 'Unknown error',
        'Finish Step': finishStep,
      });
      setIsFinishing(false);
      setFinishStep('idle');
      // Show error to user
      alert('There was an error setting up your account. Please try again or contact support.');
    }
  }, [canProceed, isFinishing, hasPortfolio, wantsPortfolio, updateStep, markComplete, router, progress, finishStep]);

  // Show loading/finishing state
  if (isFinishing) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="mb-6 md:mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
            {finishStep === 'done' ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
            {finishStep === 'done' ? 'All Set!' : 'Setting Up Your Account...'}
          </h2>
          <p className="text-base md:text-lg text-gray-700 font-semibold">
            {finishStep === 'done' 
              ? 'Redirecting you to your dashboard...'
              : finishStep === 'saving'
              ? 'Saving your information...'
              : finishStep === 'generating'
              ? 'Generating your personalized plan...'
              : finishStep === 'creating_trial'
              ? 'Creating your free trial...'
              : finishStep === 'completing'
              ? 'Finalizing setup...'
              : 'Please wait...'}
          </p>
        </div>

        {/* Trial Info Display */}
        {trialStartDate && trialEndDate && finishStep !== 'idle' && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-black text-gray-900">Your Free Trial</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                <p className="text-sm font-semibold text-gray-600 mb-1">Trial Period</p>
                <p className="text-lg font-black text-gray-900">
                  {formatDate(trialStartDate)} - {formatDate(trialEndDate)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                <p className="text-sm font-semibold text-gray-600 mb-2">What You Get:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Full access to all Accelerate features
                  </li>
                  <li className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    AI-powered resume analysis and optimization
                  </li>
                  <li className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Company research and contact discovery
                  </li>
                  <li className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Custom interview questions and practice
                  </li>
                  <li className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Product Portfolio builder
                  </li>
                </ul>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-100 rounded-xl">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <Rocket className="w-5 h-5 text-pink-600 flex-shrink-0" />
                <Zap className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm font-bold text-purple-900">
                  No credit card required. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {finishStep !== 'done' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: finishStep === 'saving' 
                  ? '20%' 
                  : finishStep === 'generating'
                  ? '40%'
                  : finishStep === 'creating_trial'
                  ? '70%'
                  : finishStep === 'completing'
                  ? '90%'
                  : '10%'
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          Tell Us About Your Portfolio
        </h2>
        <p className="text-base md:text-lg text-gray-700 font-semibold">
          A strong product portfolio can help showcase your work and stand out to recruiters.
        </p>
      </div>

      <div className="space-y-6 md:space-y-8">
        {/* Portfolio Status */}
        <div>
          <label className="block text-base md:text-lg font-bold text-gray-900 mb-4">
            Do you have a product portfolio? *
          </label>
          <div className="space-y-3">
            {PORTFOLIO_STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  hasPortfolio === option.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <input
                  type="radio"
                  name="portfolioStatus"
                  value={option.value}
                  checked={hasPortfolio === option.value}
                  onChange={(e) => handlePortfolioStatusChange(e.target.value)}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-900 font-semibold">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Context */}
        {hasPortfolio === 'have_portfolio' && (
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 font-semibold">
              Great! Having a portfolio is a strong asset. We can help you enhance it or use it to showcase your work in applications.
            </p>
          </div>
        )}

        {hasPortfolio === 'no_portfolio_want_one' && (
          <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
            <p className="text-sm text-purple-800 font-semibold">
              Perfect! We'll include portfolio building in your personalized plan. Our portfolio builder makes it easy to showcase your product work.
            </p>
          </div>
        )}

        {hasPortfolio === 'no_portfolio_not_interested' && (
          <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
            <p className="text-sm text-gray-700 font-semibold">
              No problem! We'll focus on other areas to help you achieve your goals.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
        <div
          className="relative w-full sm:w-auto"
          onMouseEnter={() => !canProceed && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button
            onClick={handleFinish}
            disabled={!canProceed || isFinishing}
            className="w-full sm:w-auto px-6 md:px-8 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
          >
            {isFinishing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting Up...
              </span>
            ) : (
              'Finish'
            )}
          </button>
          {showTooltip && !canProceed && missingFields.length > 0 && (
            <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg shadow-xl z-50 min-w-[200px] sm:min-w-[250px]">
              <div className="flex items-start">
                <span className="mr-2">!</span>
                <div>
                  <p className="font-bold mb-1">Please complete the following:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {missingFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
        <div className="flex justify-start">
          <button
            onClick={onBack}
            disabled={isFinishing}
            className="px-4 md:px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};
