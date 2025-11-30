'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { trackEvent } from '@/lib/amplitude/client';

// Weekly goal type from PlanDisplayStep
export interface WeeklyGoal {
  id: string;
  label: string;
  target: number | null;
}

interface ConfirmGoalsStepProps {
  onNext: () => void;
  onBack: () => void;
  weeklyGoals: WeeklyGoal[];
  onSaveConfirmedGoals?: (goals: WeeklyGoal[]) => void;
}

// Mapping of weekly goal IDs to display info
const WEEKLY_GOAL_INFO: Record<
  string,
  { displayName: string; description: string; unit: string; min: number; max: number }
> = {
  'weekly-applications': {
    displayName: 'Job Applications',
    description: 'Apply to quality PM roles',
    unit: 'per week',
    min: 1,
    max: 30,
  },
  'weekly-networking-calls': {
    displayName: 'Networking Calls',
    description: 'Schedule calls with PMs',
    unit: 'per week',
    min: 1,
    max: 10,
  },
  'weekly-outreach-emails': {
    displayName: 'Outreach Emails',
    description: 'Send personalized emails',
    unit: 'per week',
    min: 1,
    max: 50,
  },
  'weekly-interview-practice': {
    displayName: 'Mock Interviews',
    description: 'Practice interview sessions',
    unit: 'per week',
    min: 1,
    max: 5,
  },
  'weekly-company-research': {
    displayName: 'Company Research',
    description: 'Research target companies deeply',
    unit: 'per week',
    min: 1,
    max: 10,
  },
  'weekly-course-lessons': {
    displayName: 'Course Lessons',
    description: 'Watch lessons from courses',
    unit: 'per week',
    min: 1,
    max: 15,
  },
  'weekly-interview-prep': {
    displayName: 'Interview Prep',
    description: 'Generate questions & prep for interviews',
    unit: 'per week',
    min: 1,
    max: 5,
  },
};

export const ConfirmGoalsStep = ({
  onNext,
  onBack,
  weeklyGoals,
  onSaveConfirmedGoals,
}: ConfirmGoalsStepProps) => {
  const { updateStep } = useOnboardingProgress();
  const [isSaving, setIsSaving] = useState(false);

  // Track which goals are enabled (all enabled by default)
  const [enabledGoals, setEnabledGoals] = useState<Record<string, boolean>>({});
  // Initialize goal values from the AI-generated goals
  const [goalValues, setGoalValues] = useState<Record<string, number>>({});

  // Initialize goal values and enabled state when weeklyGoals changes
  useEffect(() => {
    const initialValues: Record<string, number> = {};
    const initialEnabled: Record<string, boolean> = {};
    weeklyGoals.forEach((goal) => {
      if (goal.target !== null) {
        initialValues[goal.id] = goal.target;
      }
      initialEnabled[goal.id] = true; // All enabled by default
    });
    setGoalValues(initialValues);
    setEnabledGoals(initialEnabled);
  }, [weeklyGoals]);

  const handleGoalToggle = (goalId: string) => {
    setEnabledGoals((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
  };

  const handleGoalValueChange = (goalId: string, value: number) => {
    const info = WEEKLY_GOAL_INFO[goalId];
    const min = info?.min ?? 1;
    const max = info?.max ?? 100;
    setGoalValues((prev) => ({
      ...prev,
      [goalId]: Math.max(min, Math.min(value, max)),
    }));
  };

  const enabledGoalsCount = Object.values(enabledGoals).filter(Boolean).length;

  // Get confirmed goals with updated values
  const getConfirmedGoals = useCallback((): WeeklyGoal[] => {
    return weeklyGoals
      .filter((goal) => enabledGoals[goal.id])
      .map((goal) => ({
        id: goal.id,
        label: goal.label,
        target: goalValues[goal.id] ?? goal.target,
      }));
  }, [weeklyGoals, enabledGoals, goalValues]);

  const handleContinue = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const confirmedGoals = getConfirmedGoals();

      // Save confirm goals step data
      await updateStep('confirm_goals', {
        confirmedGoals,
        totalGoals: weeklyGoals.length,
        enabledGoals: enabledGoalsCount,
        confirmedAt: new Date().toISOString(),
      });

      // Pass confirmed goals to parent for saving to database
      if (onSaveConfirmedGoals) {
        onSaveConfirmedGoals(confirmedGoals);
      }

      // Track Amplitude event
      trackEvent('Onboarding Step Completed', {
        Step: 'confirm_goals',
        'Step Name': 'Confirm Goals',
        'Total Goals': weeklyGoals.length,
        'Enabled Goals': enabledGoalsCount,
        'Goals': confirmedGoals.map((g) => ({
          id: g.id,
          target: g.target,
        })),
      });

      onNext();
    } catch (error) {
      console.error('Error saving confirm goals step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // If no goals were passed, show a fallback message
  if (weeklyGoals.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
            Confirm Your Weekly Goals
          </h2>
          <p className="text-base md:text-lg text-gray-700 font-semibold">
            No goals were generated. Please go back and try again.
          </p>
        </div>
        <div className="mt-8 flex items-center justify-start">
          <button
            onClick={onBack}
            className="px-4 md:px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors text-sm md:text-base"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          Confirm Your Weekly Goals
        </h2>
        <p className="text-base md:text-lg text-gray-700 font-semibold">
          Here are the weekly targets we recommend based on your plan. Adjust the numbers to fit
          your schedule.
        </p>
      </div>

      <div className="space-y-4">
        {weeklyGoals.map((goal) => {
          const info = WEEKLY_GOAL_INFO[goal.id];
          const displayName = info?.displayName ?? goal.id;
          const unit = info?.unit ?? 'per week';
          const min = info?.min ?? 1;
          const max = info?.max ?? 100;
          const value = goalValues[goal.id] ?? goal.target ?? 1;
          const isEnabled = enabledGoals[goal.id] ?? true;

          return (
            <div
              key={goal.id}
              className={`p-4 md:p-6 rounded-xl border-2 transition-all ${
                isEnabled
                  ? 'border-purple-500 bg-white'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  id={goal.id}
                  checked={isEnabled}
                  onChange={() => handleGoalToggle(goal.id)}
                  className="mt-1 w-5 h-5 text-purple-600 focus:ring-purple-500 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <label
                    htmlFor={goal.id}
                    className="block text-base md:text-lg font-bold text-gray-900 mb-1 cursor-pointer"
                  >
                    {displayName}
                  </label>
                  <p className="text-sm text-gray-600 font-medium mb-3">{goal.label}</p>
                  {isEnabled && (
                    <div className="flex items-center gap-3 mt-3">
                      <label
                        htmlFor={`${goal.id}-value`}
                        className="text-sm font-semibold text-gray-700"
                      >
                        Target:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id={`${goal.id}-value`}
                          type="number"
                          min={min}
                          max={max}
                          value={value}
                          onChange={(e) =>
                            handleGoalValueChange(goal.id, parseInt(e.target.value, 10) || min)
                          }
                          className="w-20 px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold text-center"
                        />
                        <span className="text-sm font-semibold text-gray-600">{unit}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {enabledGoalsCount > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
          <p className="text-sm font-semibold text-purple-800">
            You have {enabledGoalsCount} weekly goal{enabledGoalsCount !== 1 ? 's' : ''} selected.
            We'll track your progress and help you stay on track!
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
        <button
          onClick={handleContinue}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 md:px-8 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all text-sm md:text-base"
        >
          {isSaving ? 'Saving...' : 'Confirm & Continue →'}
        </button>
        <button
          onClick={onBack}
          className="px-4 md:px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors text-sm md:text-base"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};
