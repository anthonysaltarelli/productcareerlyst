'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { PersonalInfoStep } from '@/app/components/onboarding/PersonalInfoStep';
import { GoalsAndChallengesStep } from '@/app/components/onboarding/GoalsAndChallengesStep';
import { PortfolioStep } from '@/app/components/onboarding/PortfolioStep';
import { PageTracking } from '@/app/components/PageTracking';
import { trackEvent } from '@/lib/amplitude/client';

// Simplified onboarding flow - 3 steps only
const ALL_STEPS = [
  { id: 'personal_info', name: 'Personal Info' },
  { id: 'goals', name: 'Goals & Challenges' },
  { id: 'portfolio', name: 'Portfolio' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { progress, loading, setCurrentStep, markComplete, refresh } = useOnboardingProgress();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);


  // Check if user has active subscription
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setCheckingSubscription(false);
          return;
        }

        // Check for active subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing', 'past_due'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const hasSubscription = subscription !== null;
        setHasActiveSubscription(hasSubscription);

        // If user has active subscription, mark onboarding complete and redirect
        if (hasSubscription) {
          await markComplete();

          // Track event (non-blocking)
          setTimeout(() => {
            try {
              trackEvent('User Skipped Onboarding Trial Step', {
                'Page Route': '/onboarding',
                'Reason': 'Already has active subscription',
                'Subscription Status': subscription?.status || 'unknown',
              });
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Tracking error (non-blocking):', error);
              }
            }
          }, 0);

          router.push('/dashboard');
          router.refresh();
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasActiveSubscription(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [markComplete, router]);

  const STEPS = useMemo(() => ALL_STEPS, []);

  // Initialize step from progress (only if subscription check is complete)
  useEffect(() => {
    if (!checkingSubscription && progress?.current_step) {
      const stepIndex = STEPS.findIndex((s) => s.id === progress.current_step);
      if (stepIndex >= 0) {
        setCurrentStepIndex(stepIndex);
      }
    }
  }, [progress, checkingSubscription, STEPS]);

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const currentStep = STEPS[currentStepIndex];
      const nextStep = STEPS[nextIndex];

      // Refresh progress to get latest completed_steps
      refresh();

      setCurrentStepIndex(nextIndex);
      setCurrentStep(STEPS[nextIndex].id);

      // Scroll to top of the page for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Track step navigation (non-blocking)
      setTimeout(() => {
        try {
          trackEvent('User Navigated Onboarding Step', {
            'Page Route': '/onboarding',
            'From Step': currentStep.id,
            'From Step Name': currentStep.name,
            'To Step': nextStep.id,
            'To Step Name': nextStep.name,
            'Step Index': currentStepIndex,
            'Next Step Index': nextIndex,
            'Completed Steps': completedSteps,
            'Skipped Steps': skippedSteps,
            'Progress Percentage': Math.round(((nextIndex + 1) / STEPS.length) * 100),
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Tracking error (non-blocking):', error);
          }
        }
      }, 0);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const currentStep = STEPS[currentStepIndex];
      const prevIndex = currentStepIndex - 1;
      const prevStep = STEPS[prevIndex];

      setCurrentStepIndex(prevIndex);
      setCurrentStep(STEPS[prevIndex].id);

      // Scroll to top of the page for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Track step navigation (non-blocking)
      setTimeout(() => {
        try {
          trackEvent('User Navigated Onboarding Step', {
            'Page Route': '/onboarding',
            'From Step': currentStep.id,
            'From Step Name': currentStep.name,
            'To Step': prevStep.id,
            'To Step Name': prevStep.name,
            'Step Index': currentStepIndex,
            'Next Step Index': prevIndex,
            'Direction': 'back',
            'Completed Steps': completedSteps,
            'Skipped Steps': skippedSteps,
            'Progress Percentage': Math.round(((prevIndex + 1) / STEPS.length) * 100),
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Tracking error (non-blocking):', error);
          }
        }
      }, 0);
    }
  };

  const handleSkip = () => {
    if (currentStepIndex < STEPS.length - 1) {
      handleNext();
    }
  };

  // Show loading while checking subscription or fetching progress
  if (loading || checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[currentStepIndex];
  const progressPercentage = ((currentStepIndex + 1) / STEPS.length) * 100;
  const completedSteps = progress?.completed_steps || [];
  const skippedSteps = progress?.skipped_steps || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 pt-6 pb-8 sm:py-12 px-4">
      <PageTracking pageName="Onboarding" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-3 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 via-pink-600 to-orange-600 bg-clip-text text-transparent pb-2 mb-4">
            Welcome to Product Careerlyst!
          </h1>
          <p className="text-base sm:text-xl text-gray-700 font-semibold">
            Let's get you set up in just a few steps
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-3 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-gray-600">
              Step {currentStepIndex + 1} of {STEPS.length}
            </div>
            <div className="text-sm font-bold text-gray-600">
              {Math.round(progressPercentage)}% Complete
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="hidden sm:flex items-center justify-between mt-4">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isSkipped = skippedSteps.includes(step.id);
              const isCurrent = index === currentStepIndex;
              const isPast = index < currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center flex-1 ${
                    isCurrent ? 'font-black' : 'font-semibold'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCurrent
                        ? 'bg-purple-600 text-white scale-110'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : isSkipped
                            ? 'bg-yellow-500 text-white'
                            : isPast
                              ? 'bg-gray-300 text-gray-600'
                              : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div
                    className={`text-xs text-center ${
                      isCurrent ? 'text-purple-600' : 'text-gray-600'
                    }`}
                  >
                    {step.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200 p-[3px] sm:p-8 md:p-12">
          {currentStep.id === 'personal_info' && (
            <PersonalInfoStep onNext={handleNext} />
          )}
          {currentStep.id === 'goals' && (
            <GoalsAndChallengesStep onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep.id === 'portfolio' && (
            <PortfolioStep onNext={handleNext} onBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  );
}
