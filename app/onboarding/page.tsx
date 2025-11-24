'use client';

import { useState, useEffect } from 'react';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { ResumeUploadStep } from '@/app/components/onboarding/ResumeUploadStep';
import { BaselineStep } from '@/app/components/onboarding/BaselineStep';
import { GoalsStep } from '@/app/components/onboarding/GoalsStep';
import { FeaturesStep } from '@/app/components/onboarding/FeaturesStep';
import { TrialStep } from '@/app/components/onboarding/TrialStep';
import { PageTracking } from '@/app/components/PageTracking';
import { trackEvent } from '@/lib/amplitude/client';

const STEPS = [
  { id: 'resume_upload', name: 'Resume Upload' },
  { id: 'baseline', name: 'Baseline' },
  { id: 'targets', name: 'Goals' },
  { id: 'features', name: 'Features' },
  { id: 'trial', name: 'Trial' },
] as const;

export default function OnboardingPage() {
  const { progress, loading, setCurrentStep } = useOnboardingProgress();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Initialize step from progress
  useEffect(() => {
    if (progress?.current_step) {
      const stepIndex = STEPS.findIndex((s) => s.id === progress.current_step);
      if (stepIndex >= 0) {
        setCurrentStepIndex(stepIndex);
      }
    }
  }, [progress]);

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

  if (loading) {
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

