'use client';

import { useState, useMemo, useCallback } from 'react';
import { PersonalInfoStepVisual } from './components/PersonalInfoStepVisual';
import { GoalsAndChallengesStepVisual } from './components/GoalsAndChallengesStepVisual';
import { PortfolioQuestionStepVisual } from './components/PortfolioQuestionStepVisual';
import { PlanDisplayStepVisual } from './components/PlanDisplayStepVisual';
import { ActionableGoalsStepVisual } from './components/ActionableGoalsStepVisual';
import { TrialStepVisual } from './components/TrialStepVisual';
import { OnboardingData } from './utils/planGenerator';

const ALL_STEPS = [
  { id: 'personal_info', name: 'Personal Info' },
  { id: 'goals', name: 'Goals & Challenges' },
  { id: 'portfolio', name: 'Portfolio' },
  { id: 'plan_display', name: 'Your Plan' },
  { id: 'actionable_goals', name: 'Set Goals' },
  { id: 'trial', name: 'Start Free Trial' },
] as const;

export default function OnboardingTestPage() {
  // Block access in production (dev-only route)
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">404 - Not Found</h1>
          <p className="text-gray-600">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    personalInfo: {},
    goals: {},
  });
  const [mockProgress, setMockProgress] = useState<any>({
    completed_steps: [],
    skipped_steps: [],
    progress_data: {
      personal_info: {},
      goals: {},
      portfolio: {},
      baseline: {},
      actionable_goals: {},
    },
  });

  const STEPS = useMemo(() => {
    return ALL_STEPS;
  }, []);

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    if (currentStepIndex < STEPS.length - 1) {
      handleNext();
    }
  };

  const updatePersonalInfo = useCallback((data: Partial<OnboardingData['personalInfo']>) => {
    setOnboardingData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...data },
    }));
  }, []);

  const updateGoals = useCallback((data: Partial<OnboardingData['goals']>) => {
    setOnboardingData((prev) => ({
      ...prev,
      goals: { ...prev.goals, ...data },
    }));
  }, []);

  const currentStep = STEPS[currentStepIndex];
  const progressPercentage = ((currentStepIndex + 1) / STEPS.length) * 100;
  const completedSteps = mockProgress?.completed_steps || [];
  const skippedSteps = mockProgress?.skipped_steps || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 pt-6 pb-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-3 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 via-pink-600 to-orange-600 bg-clip-text text-transparent pb-2 mb-4">
            Welcome to Product Careerlyst!
          </h1>
          <p className="text-base sm:text-xl text-gray-700 font-semibold">
            Let's get you set up in just a few steps
          </p>
          <div className="mt-4 p-3 bg-yellow-100 border-2 border-yellow-300 rounded-xl">
            <p className="text-sm font-bold text-yellow-800">
              🧪 TEST MODE - Visual Only - No Data Saved
            </p>
          </div>
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
            <PersonalInfoStepVisual 
              onNext={handleNext} 
              onBack={handleBack} 
              onSkip={handleSkip}
              onDataUpdate={updatePersonalInfo}
            />
          )}
          {currentStep.id === 'goals' && (
            <GoalsAndChallengesStepVisual 
              onNext={handleNext} 
              onBack={handleBack} 
              onSkip={handleSkip}
              onDataUpdate={updateGoals}
            />
          )}
          {currentStep.id === 'portfolio' && (
            <PortfolioQuestionStepVisual onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />
          )}
          {currentStep.id === 'plan_display' && (
            <PlanDisplayStepVisual 
              onNext={handleNext} 
              onBack={handleBack} 
              onboardingData={onboardingData}
            />
          )}
          {currentStep.id === 'actionable_goals' && (
            <ActionableGoalsStepVisual onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />
          )}
          {currentStep.id === 'trial' && (
            <TrialStepVisual onBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  );
}
