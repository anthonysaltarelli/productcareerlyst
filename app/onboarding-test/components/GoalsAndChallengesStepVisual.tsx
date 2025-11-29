'use client';

import { useState, useCallback } from 'react';

interface GoalsAndChallengesStepVisualProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const TARGET_ROLES = [
  { value: 'associate_product_manager', label: 'Associate Product Manager' },
  { value: 'product_manager', label: 'Product Manager' },
  { value: 'senior_product_manager', label: 'Senior Product Manager' },
  { value: 'director_of_product', label: 'Director of Product' },
] as const;

const TIMELINES = [
  { value: '1_month', label: 'Within 1 month' },
  { value: '3_months', label: 'Within 3 months' },
  { value: '6_months', label: 'Within 6 months' },
  { value: '1_year', label: 'Within 1 year' },
] as const;

const STRUGGLE_SUGGESTIONS = [
  'I struggle with getting interviews despite applying to many positions.',
  'I have trouble writing a strong resume that stands out to recruiters.',
  'I need help building a product portfolio to showcase my work.',
  'I find it difficult to network effectively with other product managers.',
] as const;

const JOB_SEARCH_STAGES = [
  { value: 'not_started', label: "I haven't started actively applying yet" },
  { value: 'not_getting_interviews', label: "I'm applying but not getting interviews" },
  { value: 'not_passing_first_round', label: 'I get some interviews but rarely pass the first round' },
] as const;

const INTERVIEW_CONFIDENCE_LABELS = [
  { value: 1, label: 'Very unconfident' },
  { value: 2, label: 'Somewhat unconfident' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Somewhat confident' },
  { value: 5, label: 'Very confident' },
] as const;

export const GoalsAndChallengesStepVisual = ({ onNext, onBack }: GoalsAndChallengesStepVisualProps) => {
  const [targetRole, setTargetRole] = useState<string>('');
  const [timeline, setTimeline] = useState<string>('');
  const [struggles, setStruggles] = useState<string>('');
  const [jobSearchStage, setJobSearchStage] = useState<string>('');
  const [interviewConfidence, setInterviewConfidence] = useState<number | null>(null);
  const [isTargetRoleDropdownOpen, setIsTargetRoleDropdownOpen] = useState<boolean>(false);
  const [highlightedTargetRoleIndex, setHighlightedTargetRoleIndex] = useState<number | null>(null);
  const [shouldShowJobSearchQuestions] = useState<boolean>(true);
  
  const getTargetRoleLabel = (value: string): string => {
    const role = TARGET_ROLES.find(r => r.value === value);
    return role ? role.label : '';
  };
  
  const [targetRoleInput, setTargetRoleInput] = useState<string>(getTargetRoleLabel(targetRole));
  
  const filteredTargetRoleSuggestions = TARGET_ROLES.filter((role) => {
    if (!targetRoleInput) {
      return true;
    }
    return role.label.toLowerCase().includes(targetRoleInput.toLowerCase());
  }).slice(0, 10);

  const handleTargetRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setTargetRoleInput(nextValue);
    setIsTargetRoleDropdownOpen(true);
    setHighlightedTargetRoleIndex(null);
    
    const matchingRole = TARGET_ROLES.find(r => r.label.toLowerCase() === nextValue.toLowerCase());
    if (matchingRole) {
      setTargetRole(matchingRole.value);
    } else {
      setTargetRole('');
    }
  };

  const handleSelectTargetRole = (role: typeof TARGET_ROLES[number]) => {
    setTargetRole(role.value);
    setTargetRoleInput(role.label);
    setIsTargetRoleDropdownOpen(false);
    setHighlightedTargetRoleIndex(null);
  };

  const handleTargetRoleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredTargetRoleSuggestions.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsTargetRoleDropdownOpen(true);
      setHighlightedTargetRoleIndex((prevIndex) => {
        if (prevIndex === null) {
          return 0;
        }
        const nextIndex = prevIndex + 1;
        if (nextIndex >= filteredTargetRoleSuggestions.length) {
          return 0;
        }
        return nextIndex;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsTargetRoleDropdownOpen(true);
      setHighlightedTargetRoleIndex((prevIndex) => {
        if (prevIndex === null) {
          return filteredTargetRoleSuggestions.length - 1;
        }
        const nextIndex = prevIndex - 1;
        if (nextIndex < 0) {
          return filteredTargetRoleSuggestions.length - 1;
        }
        return nextIndex;
      });
      return;
    }

    if (event.key === 'Enter' && highlightedTargetRoleIndex !== null) {
      event.preventDefault();
      const selectedRole = filteredTargetRoleSuggestions[highlightedTargetRoleIndex];
      if (selectedRole) {
        handleSelectTargetRole(selectedRole);
      }
      return;
    }

    if (event.key === 'Escape') {
      setIsTargetRoleDropdownOpen(false);
      setHighlightedTargetRoleIndex(null);
    }
  };

  const canProceed = 
    targetRole !== '' && 
    timeline !== '' && 
    struggles.trim().length >= 10 && 
    struggles.trim().length <= 500 &&
    (!shouldShowJobSearchQuestions || (jobSearchStage !== '' && interviewConfidence !== null));

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!targetRole) missing.push('Target Role');
    if (!timeline) missing.push('Timeline');
    if (struggles.trim().length < 10) missing.push('Struggles (at least 10 characters)');
    if (struggles.trim().length > 500) missing.push('Struggles (reduce to 500 characters or less)');
    if (shouldShowJobSearchQuestions) {
      if (!jobSearchStage) missing.push('Job Search Stage');
      if (interviewConfidence === null) missing.push('Interview Confidence');
    }
    return missing;
  };

  const missingFields = getMissingFields();
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const strugglesCharCount = struggles.length;
  const strugglesCharStatus = strugglesCharCount < 10 ? 'too_short' : strugglesCharCount > 500 ? 'too_long' : 'good';

  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (struggles.trim() === '') {
      setStruggles(suggestion);
    } else if (!struggles.includes(suggestion)) {
      setStruggles(prev => prev.trim() ? `${prev.trim()} ${suggestion}` : suggestion);
    }
  }, [struggles]);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          What Are Your Goals & Challenges?
        </h2>
        <p className="text-base md:text-lg text-gray-700 font-semibold">
          We'll create a personalized plan to help you overcome these challenges.
        </p>
      </div>

      <div className="space-y-6 md:space-y-8">
        {/* Target Role */}
        <div className="relative">
          <label htmlFor="targetRole" className="block text-base md:text-lg font-bold text-gray-900 mb-2">
            Where do you want to get? *
          </label>
          <input
            id="targetRole"
            type="text"
            value={targetRoleInput}
            onChange={handleTargetRoleChange}
            placeholder="Associate Product Manager, Product Manager, etc."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold"
            required
            aria-required="true"
            aria-autocomplete="list"
            aria-expanded={isTargetRoleDropdownOpen}
            aria-controls="targetRole-suggestions"
            onFocus={() => {
              setIsTargetRoleDropdownOpen(true);
            }}
            onKeyDown={handleTargetRoleKeyDown}
          />
          {isTargetRoleDropdownOpen && filteredTargetRoleSuggestions.length > 0 && (
            <ul
              id="targetRole-suggestions"
              role="listbox"
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
            >
              {filteredTargetRoleSuggestions.map((role, index) => {
                const isHighlighted = highlightedTargetRoleIndex === index;

                return (
                  <li key={role.value} role="option" aria-selected={isHighlighted}>
                    <button
                      type="button"
                      className={`flex w-full items-center px-4 py-2 text-left text-sm font-semibold ${
                        isHighlighted ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-800'
                      }`}
                      onClick={() => handleSelectTargetRole(role)}
                      aria-label={`Select role ${role.label}`}
                    >
                      {role.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-base md:text-lg font-bold text-gray-900 mb-4">
            What's your timeline? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TIMELINES.map((t) => (
              <label
                key={t.value}
                className={`flex items-center p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${
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

        {/* Job Search Stage */}
        {shouldShowJobSearchQuestions && (
          <div>
            <label className="block text-base md:text-lg font-bold text-gray-900 mb-4">
              Where are you currently getting stuck in your search? *
            </label>
            <div className="space-y-3">
              {JOB_SEARCH_STAGES.map((stage) => (
                <label
                  key={stage.value}
                  className={`flex items-center p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    jobSearchStage === stage.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="jobSearchStage"
                    value={stage.value}
                    checked={jobSearchStage === stage.value}
                    onChange={(e) => setJobSearchStage(e.target.value)}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-3 text-gray-900 font-semibold">
                    {stage.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Interview Confidence */}
        {shouldShowJobSearchQuestions && (
          <div>
            <label className="block text-base md:text-lg font-bold text-gray-900 mb-4">
              How confident do you feel about your interview performance right now? *
            </label>
            <div className="space-y-3">
              {INTERVIEW_CONFIDENCE_LABELS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    interviewConfidence === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="interviewConfidence"
                    value={option.value}
                    checked={interviewConfidence === option.value}
                    onChange={(e) => setInterviewConfidence(parseInt(e.target.value, 10))}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-3 text-gray-900 font-semibold">
                    {option.value} - {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Struggles */}
        <div>
          <label htmlFor="struggles" className="block text-base md:text-lg font-bold text-gray-900 mb-2">
            What have you been struggling with the most? *
          </label>
          
          {/* Suggestions */}
          <div className="mb-3 space-y-2">
            {STRUGGLE_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  struggles.includes(suggestion)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
          
          <textarea
            id="struggles"
            value={struggles}
            onChange={(e) => setStruggles(e.target.value)}
            placeholder="Tell us about your biggest challenges in your PM career journey..."
            rows={6}
            maxLength={500}
            className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 font-semibold resize-none ${
              strugglesCharStatus === 'too_short'
                ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200'
                : strugglesCharStatus === 'too_long'
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-200 focus:border-purple-500 focus:ring-purple-200'
            }`}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              {strugglesCharCount < 10
                ? `Please provide more detail (at least 10 characters, ${10 - strugglesCharCount} more needed)`
                : strugglesCharCount > 500
                  ? 'Please keep it to 500 characters or less'
                  : 'Great! This helps us create a better plan for you.'}
            </p>
            <span
              className={`text-sm font-semibold ${
                strugglesCharStatus === 'too_short'
                  ? 'text-yellow-600'
                  : strugglesCharStatus === 'too_long'
                    ? 'text-red-600'
                    : 'text-gray-500'
              }`}
            >
              {strugglesCharCount}/500
            </span>
          </div>
        </div>
      </div>

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
          {showTooltip && !canProceed && missingFields.length > 0 && (
            <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg shadow-xl z-50 min-w-[200px] sm:min-w-[250px]">
              <div className="flex items-start">
                <span className="mr-2">⚠️</span>
                <div>
                  <p className="font-bold mb-1">Please complete the following:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {missingFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
        <div className="flex justify-start">
          <button
            onClick={onBack}
            className="px-4 md:px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors text-sm md:text-base"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

