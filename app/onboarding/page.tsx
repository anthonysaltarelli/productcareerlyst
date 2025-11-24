'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { ResumeUploadStep } from '@/app/components/onboarding/ResumeUploadStep';
import { BaselineStep } from '@/app/components/onboarding/BaselineStep';
import { GoalsStep } from '@/app/components/onboarding/GoalsStep';
import { FeaturesStep } from '@/app/components/onboarding/FeaturesStep';
import { TrialStep } from '@/app/components/onboarding/TrialStep';
import { PageTracking } from '@/app/components/PageTracking';
import { trackEvent } from '@/lib/amplitude/client';

const ALL_STEPS = [
  { id: 'resume_upload', name: 'Resume Upload' },
  { id: 'baseline', name: 'Baseline' },
  { id: 'targets', name: 'Goals' },
  { id: 'features', name: 'Features' },
  { id: 'trial', name: 'Trial' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { progress, loading, setCurrentStep, markComplete } = useOnboardingProgress();
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
                console.warn('⚠️ Tracking error (non-blocking):', error);
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

  // Filter out trial step if user has active subscription
  // Note: If hasActiveSubscription is true, user will be redirected, so this only matters when false
  const STEPS = useMemo(() => {
    // If subscription check is complete and user doesn't have subscription, show all steps including trial
    // If subscription check is complete and user has subscription, they'll be redirected (but filter trial just in case)
    // If subscription check is not complete, show all steps (will be filtered once check completes)
    if (hasActiveSubscription === false) {
      return ALL_STEPS;
    }
    // If hasActiveSubscription is true or null, filter out trial
    // (true = will redirect, null = still checking)
    return ALL_STEPS.filter(step => step.id !== 'trial');
  }, [hasActiveSubscription]);

  // Initialize step from progress (only if subscription check is complete)
  useEffect(() => {
    if (!checkingSubscription && progress?.current_step) {
      const stepIndex = STEPS.findIndex((s) => s.id === progress.current_step);
      if (stepIndex >= 0) {
        setCurrentStepIndex(stepIndex);
      } else {
        // If current step is 'trial' but it's filtered out, go to last step
        if (progress.current_step === 'trial' && hasActiveSubscription === false) {
          setCurrentStepIndex(STEPS.length - 1);
        }
      }
    }
  }, [progress, checkingSubscription, hasActiveSubscription, STEPS]);

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const currentStep = STEPS[currentStepIndex];
      const nextStep = STEPS[nextIndex];
      
      setCurrentStepIndex(nextIndex);
      setCurrentStep(STEPS[nextIndex].id);
      
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
            console.warn('⚠️ Tracking error (non-blocking):', error);
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
            console.warn('⚠️ Tracking error (non-blocking):', error);
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
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen py-12 px-4">
      <PageTracking pageName="Onboarding" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Welcome to Product Careerlyst!
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Let's get you set up in just a few steps
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
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
          <div className="flex items-center justify-between mt-4">
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
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 md:p-12">
          {currentStep.id === 'resume_upload' && (
            <ResumeUploadStep onNext={handleNext} onSkip={handleSkip} />
          )}
          {currentStep.id === 'baseline' && (
            <BaselineStep onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />
          )}
          {currentStep.id === 'targets' && (
            <GoalsStep onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />
          )}
          {currentStep.id === 'features' && (
            <FeaturesStep onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />
          )}
          {currentStep.id === 'trial' && (
            <TrialStep onBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  );
}

