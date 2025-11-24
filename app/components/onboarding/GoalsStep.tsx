'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { trackEvent } from '@/lib/amplitude/client';

interface GoalsStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const TIMELINES = [
  { value: '1_month', label: 'Within 1 month' },
  { value: '3_months', label: 'Within 3 months' },
  { value: '6_months', label: 'Within 6 months' },
  { value: '1_year', label: 'Within 1 year' },
] as const;

const COMPANY_TYPES = [
  { value: 'big_tech', label: 'Big Tech' },
  { value: 'startups', label: 'Startups' },
  { value: 'both', label: 'Both' },
] as const;

export const GoalsStep = ({ onNext, onBack, onSkip }: GoalsStepProps) => {
  const { progress, updateStep, completeStep } = useOnboardingProgress();
  const targetsData = progress?.progress_data?.targets || {};
  
  const [targetRole, setTargetRole] = useState<string>(targetsData.targetRole || '');
  const [timeline, setTimeline] = useState<string>(targetsData.timeline || '');
  const [targetSalary, setTargetSalary] = useState<string>(targetsData.targetSalary?.toString() || '');
  const [companyTypes, setCompanyTypes] = useState<string[]>(targetsData.companyTypes || []);

  // Auto-save on change
  useEffect(() => {
    if (targetRole || timeline || targetSalary || companyTypes.length > 0) {
      const salaryNum = targetSalary ? parseInt(targetSalary, 10) : undefined;
      updateStep('targets', {
        targetRole: targetRole || undefined,
        timeline: timeline || undefined,
        targetSalary: salaryNum,
        companyTypes: companyTypes.length > 0 ? companyTypes : undefined,
      });
    }
  }, [targetRole, timeline, targetSalary, companyTypes, updateStep]);

  // Track timeline selection (non-blocking)
  const prevTimelineRef = useRef<string>('');
  useEffect(() => {
    if (timeline && timeline !== prevTimelineRef.current) {
      prevTimelineRef.current = timeline;
      setTimeout(() => {
        try {
          trackEvent('User Selected Timeline', {
            'Page Route': '/onboarding',
            'Step': 'targets',
            'Timeline': timeline,
            'Has Target Role': targetRole !== '',
            'Has Target Salary': targetSalary !== '',
            'Company Types Count': companyTypes.length,
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Tracking error (non-blocking):', error);
          }
        }
      }, 0);
    }
  }, [timeline, targetRole, targetSalary, companyTypes.length]); // Only track when timeline changes

  // Track company type toggles (non-blocking)
  const prevCompanyTypesCountRef = useRef<number>(0);
  useEffect(() => {
    if (companyTypes.length !== prevCompanyTypesCountRef.current) {
      prevCompanyTypesCountRef.current = companyTypes.length;
      setTimeout(() => {
        try {
          trackEvent('User Toggled Company Type', {
            'Page Route': '/onboarding',
            'Step': 'targets',
            'Company Types': companyTypes,
            'Company Types Count': companyTypes.length,
            'Selected Types': companyTypes.join(', '),
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Tracking error (non-blocking):', error);
          }
        }
      }, 0);
    }
  }, [companyTypes.length, companyTypes]); // Track when count or types change

  const handleCompanyTypeToggle = useCallback((value: string) => {
    setCompanyTypes((prev) => {
      if (prev.includes(value)) {
        return prev.filter((t) => t !== value);
      } else {
        return [...prev, value];
      }
    });
  }, []);

  const handleNext = useCallback(async () => {
    await completeStep('targets');
    
    // Track step completion (non-blocking)
    setTimeout(() => {
      try {
        const salaryNum = targetSalary ? parseInt(targetSalary, 10) : null;
        trackEvent('User Completed Onboarding Step', {
          'Page Route': '/onboarding',
          'Step': 'targets',
          'Step Name': 'Goals',
          'Target Role': targetRole || null,
          'Timeline': timeline || null,
          'Has Target Salary': targetSalary !== '',
          'Target Salary': salaryNum,
          'Target Salary Range': salaryNum ? (
            salaryNum < 100000 ? 'under_100k' :
            salaryNum < 150000 ? '100k_150k' :
            salaryNum < 200000 ? '150k_200k' :
            salaryNum < 250000 ? '200k_250k' :
            'over_250k'
          ) : null,
          'Company Types': companyTypes,
          'Company Types Count': companyTypes.length,
          'Selected Company Types': companyTypes.join(', ') || null,
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Tracking error (non-blocking):', error);
        }
      }
    }, 0);
    
    onNext();
  }, [completeStep, onNext, targetRole, timeline, targetSalary, companyTypes]);

  const canProceed = targetRole !== '' && timeline !== '';

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-4">
          What Are Your Goals?
        </h2>
        <p className="text-lg text-gray-700 font-semibold">
          Help us understand where you want to go in your career.
        </p>
      </div>

      <div className="space-y-8">
        {/* Target Role */}
        <div>
          <label htmlFor="targetRole" className="block text-lg font-bold text-gray-900 mb-2">
            What role are you targeting? *
          </label>
          <input
            id="targetRole"
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Senior Product Manager, Product Lead"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold"
          />
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">
            What's your timeline? *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TIMELINES.map((t) => (
              <label
                key={t.value}
                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  timeline === t.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <input
                  type="radio"
                  name="timeline"
                  value={t.value}
                  checked={timeline === t.value}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-900 font-semibold">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Target Salary */}
        <div>
          <label htmlFor="targetSalary" className="block text-lg font-bold text-gray-900 mb-2">
            Target Salary (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
              $
            </span>
            <input
              id="targetSalary"
              type="number"
              value={targetSalary}
              onChange={(e) => setTargetSalary(e.target.value)}
              placeholder="150000"
              className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold"
            />
          </div>
        </div>

        {/* Company Types */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">
            Company Type Preference (Optional)
          </label>
          <div className="space-y-3">
            {COMPANY_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  companyTypes.includes(type.value)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={companyTypes.includes(type.value)}
                  onChange={() => handleCompanyTypeToggle(type.value)}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="ml-3 text-gray-900 font-semibold">
                  {type.label}
                </span>
              </label>
            ))}
          </div>
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
                    'Step': 'targets',
                    'Step Name': 'Goals',
                    'Target Role': targetRole || null,
                    'Timeline': timeline || null,
                    'Has Target Salary': targetSalary !== '',
                    'Company Types Count': companyTypes.length,
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

