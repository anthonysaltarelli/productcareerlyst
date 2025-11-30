'use client';

import { useState, useMemo } from 'react';
import { OnboardingData, generatePersonalizedPlan, ActionItem, PersonalizedPlan } from '../utils/planGenerator';
import { PERSONAS } from '../data/personas';

// Extended action item type that includes optional sublabel and target from AI
interface ExtendedActionItem extends ActionItem {
  sublabel?: string;
  target?: number | null;
}

// Predefined action IDs for tracking
const PREDEFINED_ACTION_IDS = new Set([
  // Resume Actions
  'resume-import', 'resume-analyze', 'resume-score-90', 'resume-export', 'resume-clone-tailored',
  // Portfolio Actions
  'portfolio-create', 'portfolio-profile', 'portfolio-generate-ideas', 'portfolio-first-case', 'portfolio-second-case', 'portfolio-publish',
  // Course Actions
  'course-resume-linkedin', 'course-portfolio', 'course-secure-referral', 'course-company-prep', 'course-pm-interviews', 'course-negotiation', 'course-pm-fundamentals',
  // Job Search Actions
  'job-add-first', 'job-add-target-companies', 'job-research-companies', 'job-track-applications',
  // Networking Actions
  'networking-add-contact', 'networking-find-contacts', 'networking-scripts',
  // Interview Prep Actions
  'interview-prep-behavioral', 'interview-practice-mock', 'interview-prep-product-design', 'interview-prep-strategy', 'interview-prep-metrics', 'interview-generate-questions', 'interview-send-thank-you',
  // Resource Actions
  'resource-resume-guide', 'resource-interview-frameworks', 'resource-negotiation-scripts', 'resource-prd-template',
  // Weekly Actions
  'weekly-applications', 'weekly-networking-calls', 'weekly-outreach-emails', 'weekly-interview-practice', 'weekly-company-research', 'weekly-course-lessons', 'weekly-follow-ups', 'weekly-interview-prep',
]);

interface PlanDisplayStepVisualProps {
  onNext: () => void;
  onBack: () => void;
  onboardingData: OnboardingData;
}

export const PlanDisplayStepVisual = ({ onNext, onBack, onboardingData }: PlanDisplayStepVisualProps) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPlan, setAiPlan] = useState<PersonalizedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate fallback plan based on onboarding data (deterministic)
  const fallbackPlan = useMemo(() => generatePersonalizedPlan(onboardingData), [onboardingData]);

  // Use AI plan if available, otherwise use fallback
  const plan = aiPlan || fallbackPlan;

  const handleGetPlan = async () => {
    if (!selectedPersonaId) return;

    const selectedPersona = PERSONAS.find(p => p.id === selectedPersonaId);
    if (!selectedPersona) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding-test/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onboardingData: selectedPersona.data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const data = await response.json();
      setAiPlan(data.plan);
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderActionItem = (action: ExtendedActionItem) => {
    const isPredefined = PREDEFINED_ACTION_IDS.has(action.id);

    return (
      <div
        key={action.id}
        className="flex items-start gap-3 p-3 md:p-4 rounded-xl border-2 border-gray-200 bg-white"
      >
        <input
          type="checkbox"
          checked={false}
          disabled
          readOnly
          className="mt-1 w-5 h-5 text-purple-600 rounded border-gray-300 cursor-not-allowed opacity-50"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-900 font-semibold">
              {action.label}
            </span>
            {isPredefined && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-purple-100 text-purple-700 border border-purple-200">
                {action.id}
              </span>
            )}
            {!isPredefined && action.id && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                custom: {action.id}
              </span>
            )}
            {action.target !== undefined && action.target !== null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                target: {action.target}
              </span>
            )}
          </div>
          {action.sublabel && (
            <p className="text-sm text-gray-500 mt-1">
              {action.sublabel}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          Your Customized Plan
        </h2>
      </div>

      {/* Persona Selector */}
      <div className="mb-6 md:mb-8 bg-white rounded-xl border-2 border-gray-200 p-4 md:p-6">
        <label htmlFor="persona-select" className="block text-base md:text-lg font-bold text-gray-900 mb-3">
          Test with Different Personas
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <select
              id="persona-select"
              value={selectedPersonaId}
              onChange={(e) => {
                setSelectedPersonaId(e.target.value);
                setAiPlan(null); // Clear previous AI plan when persona changes
                setError(null);
              }}
              disabled={isGenerating}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold bg-white h-[48px] disabled:opacity-50"
            >
              <option value="">Select a persona...</option>
              {PERSONAS.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name} - {persona.description}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGetPlan}
            disabled={!selectedPersonaId || isGenerating}
            className="w-full sm:w-auto px-6 md:px-8 h-[48px] bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base whitespace-nowrap flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Get Plan'
            )}
          </button>
        </div>
        {selectedPersonaId && (
          <p className="mt-3 text-sm text-gray-600 font-medium">
            Selected: {PERSONAS.find(p => p.id === selectedPersonaId)?.name}
          </p>
        )}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}
        {aiPlan && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600 font-medium">✨ AI-generated plan loaded!</p>
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div className="mb-6 md:mb-8">
        <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
          Summary
        </h3>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4 md:p-8">
          <p className="text-base md:text-lg text-gray-800 font-semibold leading-relaxed">
            {plan.summary}
          </p>
        </div>
      </div>

      {/* Get Started - One-time Actions */}
      {plan.baselineActions.length > 0 && (
        <div className="mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
            Get Started
          </h3>
          <div className="space-y-6">
            {plan.baselineActions.map((section, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-200 p-4 md:p-6"
              >
                <h4 className="text-lg md:text-xl font-black text-gray-900 mb-2">
                  {section.title}
                </h4>
                <p className="text-sm md:text-base text-gray-700 font-semibold mb-4">
                  {section.description}
                </p>
                <div className="space-y-2">
                  {section.actions.map(renderActionItem)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Land The Offer - Weekly Actions */}
      <div className="mb-6 md:mb-8">
        <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
          Land The Offer
        </h3>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4 md:p-6">
          <p className="text-sm md:text-base text-gray-700 font-semibold mb-4">
            {plan.weeklyGoals.description}
          </p>
          <div className="space-y-2">
            {plan.weeklyGoals.actions.map(renderActionItem)}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="px-4 md:px-6 py-2 md:py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors text-sm md:text-base"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all text-sm md:text-base"
        >
          Get Started on this Plan
        </button>
      </div>
    </div>
  );
};
