'use client';

import { useState } from 'react';

interface PortfolioQuestionStepVisualProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const PORTFOLIO_STATUS_OPTIONS = [
  { value: 'have_portfolio', label: "Yes, I have a portfolio" },
  { value: 'no_portfolio_want_one', label: "No, but I'd like to create one" },
  { value: 'no_portfolio_not_interested', label: "No, and I'm not interested in creating one" },
] as const;

export const PortfolioQuestionStepVisual = ({ onNext, onBack, onSkip }: PortfolioQuestionStepVisualProps) => {
  const [hasPortfolio, setHasPortfolio] = useState<string>('');
  const [wantsPortfolio, setWantsPortfolio] = useState<string | null>(null);

  const canProceed = hasPortfolio !== '';

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!hasPortfolio) missing.push('Portfolio Status');
    return missing;
  };

  const missingFields = getMissingFields();
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const handlePortfolioStatusChange = (value: string) => {
    setHasPortfolio(value);
    if (value === 'have_portfolio') {
      setWantsPortfolio(null);
    } else if (value === 'no_portfolio_want_one') {
      setWantsPortfolio('yes');
    } else {
      setWantsPortfolio('no');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          Tell Us About Your Portfolio
        </h2>
        <p className="text-base md:text-lg text-gray-700 font-semibold">
          A strong product portfolio can help showcase your work and stand out to recruiters.
        </p>
      </div>

      <div className="space-y-6 md:space-y-8">
        {/* Portfolio Status */}
        <div>
          <label className="block text-base md:text-lg font-bold text-gray-900 mb-4">
            Do you have a product portfolio? *
          </label>
          <div className="space-y-3">
            {PORTFOLIO_STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  hasPortfolio === option.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <input
                  type="radio"
                  name="portfolioStatus"
                  value={option.value}
                  checked={hasPortfolio === option.value}
                  onChange={(e) => handlePortfolioStatusChange(e.target.value)}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-900 font-semibold">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Context */}
        {hasPortfolio === 'have_portfolio' && (
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 font-semibold">
              💡 Great! Having a portfolio is a strong asset. We can help you enhance it or use it to showcase your work in applications.
            </p>
          </div>
        )}

        {hasPortfolio === 'no_portfolio_want_one' && (
          <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
            <p className="text-sm text-purple-800 font-semibold">
              🎨 Perfect! We'll include portfolio building in your personalized plan. Our portfolio builder makes it easy to showcase your product work.
            </p>
          </div>
        )}

        {hasPortfolio === 'no_portfolio_not_interested' && (
          <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
            <p className="text-sm text-gray-700 font-semibold">
              👍 No problem! We'll focus on other areas to help you achieve your goals.
            </p>
          </div>
        )}
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



