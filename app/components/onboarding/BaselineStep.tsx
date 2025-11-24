'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { trackEvent } from '@/lib/amplitude/client';

interface BaselineStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const CAREER_STAGES = [
  { value: 'breaking_into_product', label: 'Breaking into product' },
  { value: 'already_in_product_new_role', label: 'Already in product - looking for new role' },
  { value: 'promotion', label: 'Trying to get promoted' },
  { value: 'high_raise', label: 'Trying to get a high raise this year' },
] as const;

export const BaselineStep = ({ onNext, onBack, onSkip }: BaselineStepProps) => {
  const { progress, updateStep, completeStep } = useOnboardingProgress();
  const baselineData = progress?.progress_data?.baseline || {};
  
  const [careerStage, setCareerStage] = useState<string>(baselineData.careerStage || '');
  const [currentSalary, setCurrentSalary] = useState<string>(baselineData.currentSalary?.toString() || '');

  // Auto-save on change
  useEffect(() => {
    if (careerStage || currentSalary) {
      const salaryNum = currentSalary ? parseInt(currentSalary, 10) : undefined;
      updateStep('baseline', {
        careerStage: careerStage || undefined,
        currentSalary: salaryNum,
      });
    }
  }, [careerStage, currentSalary, updateStep]);

  // Track career stage selection (non-blocking)
  const prevCareerStageRef = useRef<string>('');
  useEffect(() => {
    if (careerStage && careerStage !== prevCareerStageRef.current) {
      prevCareerStageRef.current = careerStage;
      setTimeout(() => {
        try {
          trackEvent('User Selected Career Stage', {
            'Page Route': '/onboarding',
            'Step': 'baseline',
            'Career Stage': careerStage,
            'Has Current Salary': currentSalary !== '',
            'Current Salary': currentSalary ? parseInt(currentSalary, 10) : null,
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Tracking error (non-blocking):', error);
          }
        }
      }, 0);
    }
  }, [careerStage, currentSalary]); // Only track when careerStage changes

  const handleNext = useCallback(async () => {
    await completeStep('baseline');
    
    // Track step completion (non-blocking)
    setTimeout(() => {
      try {
        const salaryNum = currentSalary ? parseInt(currentSalary, 10) : null;
        trackEvent('User Completed Onboarding Step', {
          'Page Route': '/onboarding',
          'Step': 'baseline',
          'Step Name': 'Baseline',
          'Career Stage': careerStage,
          'Has Current Salary': currentSalary !== '',
          'Current Salary': salaryNum,
          'Salary Range': salaryNum ? (
            salaryNum < 50000 ? 'under_50k' :
            salaryNum < 100000 ? '50k_100k' :
            salaryNum < 150000 ? '100k_150k' :
            salaryNum < 200000 ? '150k_200k' :
            'over_200k'
          ) : null,
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Tracking error (non-blocking):', error);
        }
      }
    }, 0);
    
    onNext();
  }, [completeStep, onNext, careerStage, currentSalary]);

  const canProceed = careerStage !== '';

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-4">
          Tell Us About Yourself
        </h2>
        <p className="text-lg text-gray-700 font-semibold">
          Help us understand where you are in your career journey.
        </p>
      </div>

      <div className="space-y-8">
        {/* Career Stage */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">
            What's your current situation? *
          </label>
          <div className="space-y-3">
            {CAREER_STAGES.map((stage) => (
              <label
                key={stage.value}
                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  careerStage === stage.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <input
                  type="radio"
                  name="careerStage"
                  value={stage.value}
                  checked={careerStage === stage.value}
                  onChange={(e) => setCareerStage(e.target.value)}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-900 font-semibold">
                  {stage.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Current Salary */}
        <div>
          <label htmlFor="currentSalary" className="block text-lg font-bold text-gray-900 mb-2">
            Current Salary (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
              $
            </span>
            <input
              id="currentSalary"
              type="number"
              value={currentSalary}
              onChange={(e) => setCurrentSalary(e.target.value)}
              placeholder="100000"
              className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            This helps us provide better salary guidance. Your information is private.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              // Track skip (non-blocking)
              setTimeout(() => {
                try {
                  trackEvent('User Skipped Onboarding Step', {
                    'Page Route': '/onboarding',
                    'Step': 'baseline',
                    'Step Name': 'Baseline',
                    'Career Stage': careerStage || null,
                    'Has Current Salary': currentSalary !== '',
                  });
                } catch (error) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('⚠️ Tracking error (non-blocking):', error);
                  }
                }
              }, 0);
              
              onSkip();
            }}
            className="px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors"
          >
            Skip
          </button>
        </div>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-8 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

