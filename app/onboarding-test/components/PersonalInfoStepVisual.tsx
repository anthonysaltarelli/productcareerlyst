'use client';

import { useState, useEffect, useRef } from 'react';

interface PersonalInfoStepVisualProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onDataUpdate?: (data: {
    firstName?: string;
    lastName?: string;
    currentRole?: string;
    careerStage?: string;
    currentSalary?: number;
  }) => void;
}

const CAREER_STAGES = [
  { value: 'breaking_into_product', label: 'Breaking into product' },
  { value: 'already_in_product_new_role', label: 'Already in product - looking for new role' },
  { value: 'promotion', label: 'Trying to get promoted' },
  { value: 'high_raise', label: 'Trying to get a high raise this year' },
] as const;

const ROLE_SUGGESTIONS = [
  'Product Manager',
  'Senior Product Manager',
  'Group Product Manager',
  'Principal Product Manager',
  'Director of Product',
  'VP of Product',
  'Associate Product Manager',
  'Software Engineer',
  'Senior Software Engineer',
  'Data Analyst',
] as const;

export const PersonalInfoStepVisual = ({ onNext, onBack, onDataUpdate }: PersonalInfoStepVisualProps) => {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [careerStage, setCareerStage] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<string>('');
  const [currentSalary, setCurrentSalary] = useState<string>('');
  const [isCurrentRoleDropdownOpen, setIsCurrentRoleDropdownOpen] = useState<boolean>(false);
  const [highlightedRoleIndex, setHighlightedRoleIndex] = useState<number | null>(null);

  const filteredRoleSuggestions = ROLE_SUGGESTIONS.filter((role) => {
    if (!currentRole) {
      return true;
    }
    return role.toLowerCase().includes(currentRole.toLowerCase());
  }).slice(0, 10);

  const handleCurrentRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setCurrentRole(nextValue);
    setIsCurrentRoleDropdownOpen(true);
    setHighlightedRoleIndex(null);
  };

  const handleSelectCurrentRole = (role: string) => {
    setCurrentRole(role);
    setIsCurrentRoleDropdownOpen(false);
    setHighlightedRoleIndex(null);
  };

  const handleCurrentRoleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredRoleSuggestions.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsCurrentRoleDropdownOpen(true);
      setHighlightedRoleIndex((prevIndex) => {
        if (prevIndex === null) {
          return 0;
        }
        const nextIndex = prevIndex + 1;
        if (nextIndex >= filteredRoleSuggestions.length) {
          return 0;
        }
        return nextIndex;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsCurrentRoleDropdownOpen(true);
      setHighlightedRoleIndex((prevIndex) => {
        if (prevIndex === null) {
          return filteredRoleSuggestions.length - 1;
        }
        const nextIndex = prevIndex - 1;
        if (nextIndex < 0) {
          return filteredRoleSuggestions.length - 1;
        }
        return nextIndex;
      });
      return;
    }

    if (event.key === 'Enter' && highlightedRoleIndex !== null) {
      event.preventDefault();
      const selectedRole = filteredRoleSuggestions[highlightedRoleIndex];
      if (selectedRole) {
        handleSelectCurrentRole(selectedRole);
      }
      return;
    }

    if (event.key === 'Escape') {
      setIsCurrentRoleDropdownOpen(false);
      setHighlightedRoleIndex(null);
    }
  };

  const canProceed = firstName !== '' && lastName !== '' && careerStage !== '' && currentRole !== '';

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!firstName) missing.push('First Name');
    if (!lastName) missing.push('Last Name');
    if (!careerStage) missing.push('Current Situation');
    if (!currentRole) missing.push('Current Role/Title');
    return missing;
  };

  const missingFields = getMissingFields();
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // Track previous values to avoid unnecessary updates
  const prevValuesRef = useRef<{
    firstName?: string;
    lastName?: string;
    currentRole?: string;
    careerStage?: string;
    currentSalary?: number;
  }>({
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    currentRole: currentRole || undefined,
    careerStage: careerStage || undefined,
    currentSalary: currentSalary ? parseInt(currentSalary, 10) : undefined,
  });

  // Update parent data when fields change
  useEffect(() => {
    const currentValues = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      currentRole: currentRole || undefined,
      careerStage: careerStage || undefined,
      currentSalary: currentSalary ? parseInt(currentSalary, 10) : undefined,
    };

    // Only update if values actually changed
    const hasChanged = 
      prevValuesRef.current.firstName !== currentValues.firstName ||
      prevValuesRef.current.lastName !== currentValues.lastName ||
      prevValuesRef.current.currentRole !== currentValues.currentRole ||
      prevValuesRef.current.careerStage !== currentValues.careerStage ||
      prevValuesRef.current.currentSalary !== currentValues.currentSalary;

    if (hasChanged && onDataUpdate) {
      prevValuesRef.current = {
        firstName: currentValues.firstName,
        lastName: currentValues.lastName,
        currentRole: currentValues.currentRole,
        careerStage: currentValues.careerStage,
        currentSalary: currentValues.currentSalary,
      };
      onDataUpdate(currentValues);
    }
  }, [firstName, lastName, currentRole, careerStage, currentSalary, onDataUpdate]);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          Tell Us About Yourself
        </h2>
        <p className="text-base md:text-lg text-gray-700 font-semibold">
          We'll personalize your experience based on your situation.
        </p>
      </div>

      <div className="space-y-6 md:space-y-8">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label htmlFor="firstName" className="block text-base md:text-lg font-bold text-gray-900 mb-2">
              First Name *
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-base md:text-lg font-bold text-gray-900 mb-2">
              Last Name *
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold"
              required
            />
          </div>
        </div>

        {/* Career Stage */}
        <div>
          <label className="block text-base md:text-lg font-bold text-gray-900 mb-4">
            What's your current situation? *
          </label>
          <div className="space-y-3">
            {CAREER_STAGES.map((stage) => (
              <label
                key={stage.value}
                className={`flex items-center p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${
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

        {/* Current Role */}
        <div className="relative">
          <label htmlFor="currentRole" className="block text-base md:text-lg font-bold text-gray-900 mb-2">
            Current Role/Title *
          </label>
          <input
            id="currentRole"
            type="text"
            value={currentRole}
            onChange={handleCurrentRoleChange}
            placeholder="Software Engineer, Product Manager, etc."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold"
            required
            aria-required="true"
            aria-autocomplete="list"
            aria-expanded={isCurrentRoleDropdownOpen}
            aria-controls="currentRole-suggestions"
            onFocus={() => {
              setIsCurrentRoleDropdownOpen(true);
            }}
            onKeyDown={handleCurrentRoleKeyDown}
          />
          {isCurrentRoleDropdownOpen && filteredRoleSuggestions.length > 0 && (
            <ul
              id="currentRole-suggestions"
              role="listbox"
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
            >
              {filteredRoleSuggestions.map((role, index) => {
                const isHighlighted = highlightedRoleIndex === index;

                return (
                  <li key={role} role="option" aria-selected={isHighlighted}>
                    <button
                      type="button"
                      className={`flex w-full items-center px-4 py-2 text-left text-sm font-semibold ${
                        isHighlighted ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-800'
                      }`}
                      onClick={() => handleSelectCurrentRole(role)}
                      aria-label={`Select role ${role}`}
                    >
                      {role}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Current Salary (Optional) */}
        <div>
          <label htmlFor="currentSalary" className="flex items-center justify-between w-full text-base md:text-lg font-bold text-gray-900 mb-2">
            <span>Current Salary (Optional)</span>
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

