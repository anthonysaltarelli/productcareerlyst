'use client';

import { useState } from 'react';

interface ActionableGoalsStepVisualProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const GOAL_TYPES = [
  { 
    id: 'networking', 
    label: 'Networking & Outreach', 
    description: 'Reach out to contacts, attend events, build relationships',
    unit: 'contacts per week',
    defaultValue: 5,
    min: 1,
    max: 50,
  },
  { 
    id: 'applications', 
    label: 'Job Applications', 
    description: 'Apply to positions that match your goals',
    unit: 'applications per week',
    defaultValue: 5,
    min: 1,
    max: 30,
  },
  { 
    id: 'learning', 
    label: 'Learning & Courses', 
    description: 'Complete courses and build new skills',
    unit: 'courses per month',
    defaultValue: 1,
    min: 1,
    max: 10,
  },
  { 
    id: 'portfolio', 
    label: 'Portfolio Building', 
    description: 'Add case studies and showcase your work',
    unit: 'case studies per month',
    defaultValue: 1,
    min: 1,
    max: 5,
  },
  { 
    id: 'interviews', 
    label: 'Interview Practice', 
    description: 'Schedule and prepare for interviews',
    unit: 'interviews per month',
    defaultValue: 2,
    min: 1,
    max: 20,
  },
] as const;

export const ActionableGoalsStepVisual = ({ onNext, onBack, onSkip }: ActionableGoalsStepVisualProps) => {
  const [selectedGoals, setSelectedGoals] = useState<Record<string, { enabled: boolean; value: number }>>({});

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) => {
      const goal = GOAL_TYPES.find((g) => g.id === goalId);
      if (!goal) return prev;

      const isCurrentlyEnabled = prev[goalId]?.enabled || false;
      return {
        ...prev,
        [goalId]: {
          enabled: !isCurrentlyEnabled,
          value: isCurrentlyEnabled ? prev[goalId]?.value || goal.defaultValue : goal.defaultValue,
        },
      };
    });
  };

  const handleGoalValueChange = (goalId: string, value: number) => {
    setSelectedGoals((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId]!,
        value: Math.max(1, Math.min(value, GOAL_TYPES.find((g) => g.id === goalId)?.max || 100)),
      },
    }));
  };

  const enabledGoalsCount = Object.values(selectedGoals).filter((g) => g.enabled).length;
  const canProceed = enabledGoalsCount > 0;

  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          Set Your Actionable Goals
        </h2>
        <p className="text-base md:text-lg text-gray-700 font-semibold">
          Based on your personalized plan, set trackable goals to keep yourself accountable. We'll help you track your progress!
        </p>
      </div>

      <div className="space-y-4">
        {GOAL_TYPES.map((goal) => {
          const isEnabled = selectedGoals[goal.id]?.enabled || false;
          const value = selectedGoals[goal.id]?.value || goal.defaultValue;

          return (
            <div
              key={goal.id}
              className={`p-4 md:p-6 rounded-xl border-2 transition-all ${
                isEnabled
                  ? 'border-purple-500 bg-purple-50'
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
                    {goal.label}
                  </label>
                  <p className="text-sm text-gray-600 font-medium mb-3">
                    {goal.description}
                  </p>
                  {isEnabled && (
                    <div className="flex items-center gap-3 mt-3">
                      <label htmlFor={`${goal.id}-value`} className="text-sm font-semibold text-gray-700">
                        Target:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id={`${goal.id}-value`}
                          type="number"
                          min={goal.min}
                          max={goal.max}
                          value={value}
                          onChange={(e) => handleGoalValueChange(goal.id, parseInt(e.target.value, 10) || goal.min)}
                          className="w-20 px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold text-center"
                        />
                        <span className="text-sm font-semibold text-gray-600">
                          {goal.unit}
                        </span>
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
            ✅ You've set {enabledGoalsCount} goal{enabledGoalsCount !== 1 ? 's' : ''}. We'll track your progress and help you stay on track!
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
        <div 
          className="relative w-full sm:w-auto"
          onMouseEnter={() => !canProceed && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full sm:w-auto px-6 md:px-8 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
          >
            Continue →
          </button>
          {showTooltip && !canProceed && (
            <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg shadow-xl z-50 min-w-[200px] sm:min-w-[250px]">
              <div className="flex items-start">
                <span className="mr-2">⚠️</span>
                <div>
                  <p className="font-bold mb-1">Please select at least one goal</p>
                  <p className="text-xs">Choose at least one goal to track your progress and stay accountable.</p>
                </div>
              </div>
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
        <div className="flex justify-start gap-3">
          <button
            onClick={onBack}
            className="px-4 md:px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors text-sm md:text-base"
          >
            ← Back
          </button>
          <button
            onClick={onSkip}
            className="px-4 md:px-6 py-3 text-gray-500 font-semibold hover:text-gray-700 transition-colors text-sm md:text-base"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};



