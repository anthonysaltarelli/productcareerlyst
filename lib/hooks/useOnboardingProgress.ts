'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { OnboardingProgress } from '@/lib/utils/onboarding';

interface UseOnboardingProgressReturn {
  progress: OnboardingProgress | null;
  loading: boolean;
  error: string | null;
  currentStep: string | null;
  updateProgress: (updates: Partial<OnboardingProgress>) => Promise<void>;
  updateStep: (step: string, stepData: any) => Promise<void>;
  completeStep: (step: string) => Promise<void>;
  skipStep: (step: string) => Promise<void>;
  setCurrentStep: (step: string) => Promise<void>;
  markComplete: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useOnboardingProgress = (): UseOnboardingProgressReturn => {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<OnboardingProgress>>({});

  // Fetch initial progress
  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/onboarding/progress');
      
      if (!response.ok) {
        throw new Error('Failed to fetch onboarding progress');
      }

      const data = await response.json();
      setProgress(data.progress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress';
      setError(errorMessage);
      console.error('Error fetching onboarding progress:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-save with debouncing
  const debouncedSave = useCallback(async (updates: Partial<OnboardingProgress>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Merge with pending updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const updatesToSave = { ...pendingUpdatesRef.current };
        pendingUpdatesRef.current = {};

        const response = await fetch('/api/onboarding/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatesToSave),
        });

        if (!response.ok) {
          throw new Error('Failed to save progress');
        }

        const data = await response.json();
        setProgress(data.progress);
      } catch (err) {
        console.error('Error auto-saving progress:', err);
        // Don't set error state for auto-save failures to avoid disrupting UX
      }
    }, 500); // 500ms debounce
  }, []);

  // Update progress (with auto-save)
  const updateProgress = useCallback(async (updates: Partial<OnboardingProgress>) => {
    // Optimistically update local state
    setProgress((prev) => {
      if (!prev) {
        // If no progress exists, we'll need to create it
        return null;
      }
      return {
        ...prev,
        ...updates,
      };
    });

    // Debounced save
    await debouncedSave(updates);
  }, [debouncedSave]);

  // Update specific step data
  const updateStep = useCallback(async (step: string, stepData: any) => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step, stepData }),
      });

      if (!response.ok) {
        throw new Error('Failed to update step');
      }

      const data = await response.json();
      setProgress(data.progress);
    } catch (err) {
      console.error('Error updating step:', err);
      throw err;
    }
  }, []);

  // Complete a step
  const completeStep = useCallback(async (step: string) => {
    const currentCompleted = progress?.completed_steps || [];
    if (!currentCompleted.includes(step)) {
      try {
        // Make direct API call to ensure immediate save (not debounced)
        const response = await fetch('/api/onboarding/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completed_steps: [...currentCompleted, step],
            current_step: step,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to complete step');
        }

        const data = await response.json();
        setProgress(data.progress);
      } catch (err) {
        console.error('Error completing step:', err);
        throw err;
      }
    }
  }, [progress]);

  // Skip a step
  const skipStep = useCallback(async (step: string) => {
    const currentSkipped = progress?.skipped_steps || [];
    if (!currentSkipped.includes(step)) {
      await updateProgress({
        skipped_steps: [...currentSkipped, step],
      });
    }
  }, [progress, updateProgress]);

  // Set current step
  const setCurrentStep = useCallback(async (step: string) => {
    await updateProgress({ current_step: step });
  }, [updateProgress]);

  // Mark onboarding as complete
  const markComplete = useCallback(async () => {
    await updateProgress({
      is_complete: true,
      completed_at: new Date().toISOString(),
    });
  }, [updateProgress]);

  // Refresh progress from server
  const refresh = useCallback(async () => {
    await fetchProgress();
  }, [fetchProgress]);

  // Fetch on mount
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    progress,
    loading,
    error,
    currentStep: progress?.current_step || null,
    updateProgress,
    updateStep,
    completeStep,
    skipStep,
    setCurrentStep,
    markComplete,
    refresh,
  };
};

