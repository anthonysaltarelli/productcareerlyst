'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';

const NPS_LABELS: Record<number, string> = {
  0: 'Not at all likely',
  1: 'Very unlikely',
  2: 'Unlikely',
  3: 'Somewhat unlikely',
  4: 'Neutral',
  5: 'Somewhat likely',
  6: 'Likely',
  7: 'Very likely',
  8: 'Extremely likely',
  9: 'Definitely',
  10: 'Absolutely',
};

const getNPSCategory = (rating: number): 'detractor' | 'passive' | 'promoter' => {
  if (rating >= 0 && rating <= 6) return 'detractor';
  if (rating >= 7 && rating <= 8) return 'passive';
  return 'promoter';
};

const getNPSColor = (rating: number): string => {
  const category = getNPSCategory(rating);
  if (category === 'detractor') return 'text-red-600';
  if (category === 'passive') return 'text-yellow-600';
  return 'text-green-600';
};

const FeedbackPageContent = () => {
  const searchParams = useSearchParams();
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Get URL params
  const userIdParam = searchParams.get('user_id');
  const ratingParam = searchParams.get('rating');
  const sourceParam = searchParams.get('source') || 'direct';

  // Load existing rating or handle URL params on mount
  useEffect(() => {
    const loadRating = async () => {
      try {
        setIsLoading(true);

        // If URL params exist, save rating immediately
        if (ratingParam) {
          const ratingNum = parseInt(ratingParam, 10);
          if (!isNaN(ratingNum) && ratingNum >= 0 && ratingNum <= 10) {
            // Save rating from URL params
            const response = await fetch('/api/ratings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                rating: ratingNum,
                feedback: null,
                source: sourceParam,
                user_id: userIdParam || null,
              }),
            });

            if (!response.ok) {
              // Log error but don't block the user - they can still submit the form
              let errorData = {};
              try {
                const text = await response.text();
                if (text) {
                  errorData = JSON.parse(text);
                }
              } catch (e) {
                // Response might not be JSON, that's okay
                console.error('Error parsing error response:', e);
              }
              console.error('Error saving rating from URL params:', {
                status: response.status,
                statusText: response.statusText,
                errorData,
              });
              // Set the rating from URL param anyway so user can see it and submit
              setRating(ratingNum);
              setInitialLoadComplete(true);
              setIsLoading(false);
              return;
            }

            const { rating: savedRating } = await response.json();
            setRating(savedRating.rating);
            setFeedback(savedRating.feedback || '');
            setInitialLoadComplete(true);
            setIsLoading(false);
            return;
          }
        }

        // Otherwise, load existing rating (only works if authenticated)
        const response = await fetch('/api/ratings');
        if (response.ok) {
          const { rating: existingRating } = await response.json();
          if (existingRating) {
            setRating(existingRating.rating);
            setFeedback(existingRating.feedback || '');
          }
        }
        setInitialLoadComplete(true);
      } catch (err) {
        // Log error but don't show it to user - allow them to use the form
        console.error('Error loading rating:', err);
        // Don't set error state - just allow user to proceed
      } finally {
        setIsLoading(false);
      }
    };

    loadRating();
  }, [ratingParam, userIdParam, sourceParam]);

  const handleSave = async () => {
    if (rating === null) {
      setError('Please select a rating');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || null,
          source: sourceParam,
          user_id: userIdParam || null,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Unable to save your rating. Please try again.';
        try {
          const text = await response.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {
          // Response might not be JSON, use default message
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Error saving rating:', err);
      // Show user-friendly error message
      setError('Unable to save your rating. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_15px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-3">
              How likely are you to recommend us to a friend?
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 font-semibold">
              Your feedback helps us serve you better.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_10px_0_0_rgba(0,0,0,0.1)] sm:shadow-[0_12px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200 p-6 sm:p-8 md:p-10">
          {error && (
            <div className="mb-6 p-4 rounded-[1.5rem] bg-gradient-to-br from-red-100 to-orange-100 border-2 border-red-300 shadow-md">
              <p className="text-red-800 font-bold text-center">{error}</p>
            </div>
          )}

          {isSaved && (
            <div className="mb-6 p-4 rounded-[1.5rem] bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-300 shadow-md flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-bold">Rating saved successfully!</p>
            </div>
          )}

          {/* NPS Scale */}
          <div className="mb-8">
            {/* Labels above the scale */}
            <div className="flex justify-between mb-2 px-1">
              <span className="text-sm font-bold text-gray-700">Not likely</span>
              <span className="text-sm font-bold text-gray-700">Very likely</span>
            </div>

            {/* Scale buttons - all on one row, no wrapping */}
            <div className="flex gap-1.5 sm:gap-2 mb-4">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setRating(i);
                    setIsSaved(false);
                  }}
                  className={`
                    flex-1 py-3 px-2 sm:px-3 rounded-[1rem] border-2 font-black text-sm sm:text-base
                    transition-all duration-200 min-w-0
                    ${rating === i
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-purple-600 shadow-[0_4px_0_0_rgba(147,51,234,0.5)] scale-105'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                    }
                  `}
                  aria-label={`Rate ${i}: ${NPS_LABELS[i] || 'N/A'}`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="mb-6">
            <label
              htmlFor="feedback"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Additional feedback (optional)
            </label>
            <textarea
              id="feedback"
              rows={6}
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                setIsSaved(false);
              }}
              placeholder="Tell us more about your experience..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-[1rem] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none font-medium transition-all"
            />
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={rating === null || isSaving}
            className={`
              w-full px-8 py-4 rounded-[1.5rem] font-black text-base sm:text-lg text-white
              transition-all duration-200
              ${rating === null || isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-[0_6px_0_0_rgba(147,51,234,0.5)] hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.5)]'
              }
            `}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Rating →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-700 font-semibold">Loading...</p>
          </div>
        </div>
      }
    >
      <FeedbackPageContent />
    </Suspense>
  );
}

