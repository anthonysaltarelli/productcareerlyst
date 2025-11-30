'use client';

import { useState, useMemo } from 'react';
import { OnboardingData, generatePersonalizedPlan, ActionItem } from '../utils/planGenerator';
import { PERSONAS, Persona } from '../data/personas';

interface PlanDisplayStepVisualProps {
  onNext: () => void;
  onBack: () => void;
  onboardingData: OnboardingData;
}

export const PlanDisplayStepVisual = ({ onNext, onBack, onboardingData }: PlanDisplayStepVisualProps) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');

  // Generate personalized plan based on onboarding data
  const plan = useMemo(() => generatePersonalizedPlan(onboardingData), [onboardingData]);

  const handleGetPlan = () => {
    // Button does nothing for now - placeholder for OpenAI integration
  };

  const renderActionItem = (action: ActionItem) => {
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
        <span className="flex-1 text-gray-900 font-semibold">
          {action.label}
        </span>
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
              onChange={(e) => setSelectedPersonaId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold bg-white h-[48px]"
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
            disabled={!selectedPersonaId}
            className="w-full sm:w-auto px-6 md:px-8 h-[48px] bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base whitespace-nowrap flex items-center justify-center"
          >
            Get Plan
          </button>
        </div>
        {selectedPersonaId && (
          <p className="mt-3 text-sm text-gray-600 font-medium">
            Selected: {PERSONAS.find(p => p.id === selectedPersonaId)?.name}
          </p>
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
