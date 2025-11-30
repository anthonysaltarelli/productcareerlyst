'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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

// Weekly goal type for passing to ConfirmGoalsStepVisual
export interface WeeklyGoalForConfirm {
  id: string;
  label: string;
  target: number | null;
}

interface PlanDisplayStepVisualProps {
  onNext: () => void;
  onBack: () => void;
  onboardingData: OnboardingData;
  onSaveWeeklyGoals?: (goals: WeeklyGoalForConfirm[]) => void;
}

export const PlanDisplayStepVisual = ({ onNext, onBack, onboardingData, onSaveWeeklyGoals }: PlanDisplayStepVisualProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPlan, setAiPlan] = useState<PersonalizedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const hasGeneratedRef = useRef(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const INITIAL_ITEMS_TO_SHOW = 3;

  const toggleSection = (sectionIndex: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionIndex)) {
        newSet.delete(sectionIndex);
      } else {
        newSet.add(sectionIndex);
      }
      return newSet;
    });
  };

  // Generate fallback plan based on onboarding data (deterministic)
  const fallbackPlan = useMemo(() => generatePersonalizedPlan(onboardingData), [onboardingData]);

  // Use AI plan if available, otherwise use fallback
  const plan = aiPlan || fallbackPlan;

  // Function to generate plan from data
  const generatePlan = async (data: OnboardingData) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding-test/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onboardingData: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const responseData = await response.json();
      setAiPlan(responseData.plan);
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate plan on mount using user's onboarding data
  useEffect(() => {
    if (!hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      generatePlan(onboardingData);
    }
  }, [onboardingData]);

  // Handle persona-based plan generation (debug mode)
  const handleGetPersonaPlan = async () => {
    if (!selectedPersonaId) return;

    const selectedPersona = PERSONAS.find(p => p.id === selectedPersonaId);
    if (!selectedPersona) return;

    await generatePlan(selectedPersona.data);
  };

  // Regenerate with current onboarding data
  const handleRegenerate = async () => {
    await generatePlan(onboardingData);
  };

  // Handle "Get Started on this Plan" - save weekly goals and continue
  const handleContinue = () => {
    if (onSaveWeeklyGoals && plan.weeklyGoals?.actions) {
      const goalsToSave: WeeklyGoalForConfirm[] = plan.weeklyGoals.actions.map((action: ExtendedActionItem) => ({
        id: action.id,
        label: action.label,
        target: action.target ?? null,
      }));
      onSaveWeeklyGoals(goalsToSave);
    }
    onNext();
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
            {showDebugPanel && isPredefined && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-purple-100 text-purple-700 border border-purple-200">
                {action.id}
              </span>
            )}
            {showDebugPanel && !isPredefined && action.id && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                custom: {action.id}
              </span>
            )}
            {showDebugPanel && action.target !== undefined && action.target !== null && (
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

  // Loading state
  if (isGenerating && !aiPlan) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-purple-500 rounded-full absolute top-0 left-0 animate-spin border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">
              Creating Your Personalized Plan
            </h3>
            <p className="text-gray-600 font-medium">
              Analyzing your goals and crafting the perfect roadmap...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          Your Customized Plan
        </h2>
        {/* Debug toggle - small clickable area in corner */}
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          title="Toggle debug panel"
        >
          {showDebugPanel ? '🔧 Hide Debug' : '🔧'}
        </button>
      </div>

      {/* Debug Panel - Hidden by default */}
      {showDebugPanel && (
        <div className="mb-6 md:mb-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Debug Panel</span>
            {aiPlan && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                AI Plan Active
              </span>
            )}
          </div>

          {/* Regenerate with current data */}
          <div className="mb-4">
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-bold text-purple-600 border-2 border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? 'Regenerating...' : '↻ Regenerate Plan'}
            </button>
          </div>

          {/* Persona Selector */}
          <label htmlFor="persona-select" className="block text-sm font-bold text-gray-700 mb-2">
            Test with Different Personas
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <select
                id="persona-select"
                value={selectedPersonaId}
                onChange={(e) => {
                  setSelectedPersonaId(e.target.value);
                  setError(null);
                }}
                disabled={isGenerating}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-sm font-medium bg-white disabled:opacity-50"
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
              onClick={handleGetPersonaPlan}
              disabled={!selectedPersonaId || isGenerating}
              className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Loading...' : 'Load Persona'}
            </button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Error state (non-debug) */}
      {error && !showDebugPanel && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-red-600 font-medium mb-2">Something went wrong generating your plan.</p>
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="text-sm font-bold text-red-600 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

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
            {plan.baselineActions.map((section, index) => {
              const isExpanded = expandedSections.has(index);
              const hasMoreItems = section.actions.length > INITIAL_ITEMS_TO_SHOW;
              const visibleActions = isExpanded
                ? section.actions
                : section.actions.slice(0, INITIAL_ITEMS_TO_SHOW);
              const hiddenCount = section.actions.length - INITIAL_ITEMS_TO_SHOW;

              return (
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
                    {visibleActions.map(renderActionItem)}
                  </div>
                  {hasMoreItems && (
                    <button
                      onClick={() => toggleSection(index)}
                      className="mt-3 text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <span>Show less</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>Show {hiddenCount} more</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
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
          onClick={handleContinue}
          className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all text-sm md:text-base"
        >
          Get Started on this Plan
        </button>
      </div>
    </div>
  );
};
