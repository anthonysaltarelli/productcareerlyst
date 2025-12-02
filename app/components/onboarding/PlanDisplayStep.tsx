'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { trackEvent } from '@/lib/amplitude/client';
import {
  OnboardingData,
  ActionItem,
  PersonalizedPlan,
} from '@/lib/utils/planGenerator';

// Extended action item type that includes optional sublabel and target from AI
interface ExtendedActionItem extends ActionItem {
  sublabel?: string;
  target?: number | null;
}

// Predefined action IDs for tracking
const PREDEFINED_ACTION_IDS = new Set([
  // Resume Actions
  'resume-import',
  'resume-analyze',
  'resume-score-90',
  'resume-export',
  'resume-clone-tailored',
  // Portfolio Actions
  'portfolio-create',
  'portfolio-profile',
  'portfolio-generate-ideas',
  'portfolio-first-case',
  'portfolio-second-case',
  'portfolio-publish',
  // Course Actions
  'course-resume-linkedin',
  'course-portfolio',
  'course-secure-referral',
  'course-company-prep',
  'course-pm-interviews',
  'course-negotiation',
  'course-pm-fundamentals',
  // Job Search Actions
  'job-add-first',
  'job-research-companies',
  'job-track-applications',
  // Networking Actions
  'networking-add-contact',
  'networking-find-contacts',
  'networking-scripts',
  // Interview Prep Actions
  'interview-prep-behavioral',
  'interview-practice-mock',
  'interview-prep-product-design',
  'interview-prep-strategy',
  'interview-prep-metrics',
  'interview-generate-questions',
  'interview-send-thank-you',
  // Resource Actions
  'resource-resume-guide',
  'resource-interview-frameworks',
  'resource-negotiation-scripts',
  'resource-prd-template',
  // Weekly Actions
  'weekly-applications',
  'weekly-networking-calls',
  'weekly-outreach-emails',
  'weekly-interview-practice',
  'weekly-company-research',
  'weekly-course-lessons',
  'weekly-interview-prep',
]);

// Weekly goal type for passing to TrialStep
export interface WeeklyGoalForConfirm {
  id: string;
  label: string;
  target: number | null;
}

interface PlanDisplayStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveWeeklyGoals?: (goals: WeeklyGoalForConfirm[]) => void;
  onSavePlan?: (plan: PersonalizedPlan) => void;
  existingPlan?: PersonalizedPlan | null; // Pass existing plan to avoid regeneration
}

export const PlanDisplayStep = ({
  onNext,
  onBack,
  onSaveWeeklyGoals,
  onSavePlan,
  existingPlan,
}: PlanDisplayStepProps) => {
  const { progress, updateStep } = useOnboardingProgress();
  const [isGenerating, setIsGenerating] = useState(false);
  // Initialize with existing plan if available
  const [aiPlan, setAiPlan] = useState<PersonalizedPlan | null>(existingPlan || null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasGeneratedRef = useRef(existingPlan !== null && existingPlan !== undefined);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  // Timeline labels mapping
  const TIMELINE_LABELS: Record<string, string> = {
    '1_month': 'Within 1 month',
    '3_months': 'Within 3 months',
    '6_months': 'Within 6 months',
    '1_year': 'Within 1 year',
  };

  // Collect onboarding data from progress
  const onboardingData: OnboardingData = useMemo(() => {
    if (!progress?.progress_data) return {};

    return {
      personalInfo: progress.progress_data.personal_info,
      goals: progress.progress_data.goals,
      portfolio: progress.progress_data.portfolio,
    };
  }, [progress]);

  // The plan to display - only use AI-generated plan
  // If no plan is available and there's an error, we show an error state
  const plan = aiPlan;

  // Calculate plan statistics
  const planStats = useMemo(() => {
    if (!plan) return null;

    // Count total milestones (all actions across all baseline sections)
    const totalMilestones = plan.baselineActions.reduce(
      (total, section) => total + section.actions.length,
      0
    );

    // Count weekly actions
    const totalWeeklyActions = plan.weeklyGoals?.actions?.length || 0;

    // Get target role and timeline from progress
    const targetRole = progress?.progress_data?.goals?.targetRole || 'your target role';
    const timelineValue = progress?.progress_data?.goals?.timeline || '';
    const timeline = timelineValue ? TIMELINE_LABELS[timelineValue] || timelineValue : 'your timeline';

    return {
      totalMilestones,
      totalWeeklyActions,
      targetRole,
      timeline,
    };
  }, [plan, progress]);

  // Loading messages that rotate during plan generation
  const loadingMessages = [
    { text: 'Analyzing your career goals and background...', icon: '🎯' },
    { text: 'Crafting personalized action items for your journey...', icon: '✨' },
    { text: 'Designing your custom roadmap to success...', icon: '🗺️' },
    { text: 'Optimizing weekly goals based on your timeline...', icon: '📈' },
    { text: 'Finalizing your personalized plan...', icon: '🎨' },
    { text: 'Almost there! Adding the finishing touches...', icon: '🚀' },
  ];

  // Rotate loading messages and update progress when loading
  useEffect(() => {
    const isLoading = isGenerating || (!aiPlan && !error);
    
    if (!isLoading) {
      setLoadingMessageIndex(0);
      setProgressPercent(0);
      startTimeRef.current = null;
      return;
    }

    // Initialize start time
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    // Update progress based on elapsed time (30 seconds average)
    const progressInterval = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const estimatedTotal = 30000; // 30 seconds
        const percent = Math.min(95, Math.floor((elapsed / estimatedTotal) * 100));
        setProgressPercent(percent);
      }
    }, 200);

    // Rotate messages every 5 seconds
    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 5000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isGenerating, aiPlan, error, loadingMessages.length]);

  // Function to generate plan from data
  const generatePlan = async (data: OnboardingData) => {
    setIsGenerating(true);
    setError(null);
    setProgressPercent(0);
    startTimeRef.current = Date.now();

    try {
      const response = await fetch('/api/onboarding/generate-plan', {
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
      setProgressPercent(100);
      // Small delay to show 100% before setting plan
      setTimeout(() => {
        setAiPlan(responseData.plan);
      }, 300);
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
      // Use fallback plan on error
      setIsGenerating(false);
    } finally {
      // Don't set isGenerating to false here - let the setTimeout above handle it
    }
  };

  // Auto-generate plan on mount using user's onboarding data
  useEffect(() => {
    if (!hasGeneratedRef.current && progress?.progress_data) {
      hasGeneratedRef.current = true;
      generatePlan(onboardingData);
    }
  }, [onboardingData, progress]);

  // Regenerate with current onboarding data
  const handleRegenerate = async () => {
    await generatePlan(onboardingData);
  };

  // Handle "Get Started on this Plan" - save plan and weekly goals, then continue
  const handleContinue = async () => {
    if (isSaving || !plan) return;

    setIsSaving(true);
    try {
      // Save plan display step data
      await updateStep('plan_display', {
        planGenerated: true,
        generatedAt: new Date().toISOString(),
      });

      // Pass weekly goals to parent for ConfirmGoalsStep
      if (onSaveWeeklyGoals && plan.weeklyGoals?.actions) {
        const goalsToSave: WeeklyGoalForConfirm[] = plan.weeklyGoals.actions.map(
          (action: ExtendedActionItem) => ({
            id: action.id,
            label: action.label,
            target: action.target ?? null,
          })
        );
        onSaveWeeklyGoals(goalsToSave);
      }

      // Pass full plan to parent for saving to database
      if (onSavePlan) {
        onSavePlan(plan);
      }

      // Track Amplitude event
      trackEvent('Onboarding Step Completed', {
        Step: 'plan_display',
        'Step Name': 'Plan Display',
        'Plan Generated': true,
        'AI Plan Used': aiPlan !== null,
        'Baseline Sections Count': plan.baselineActions.length,
        'Weekly Goals Count': plan.weeklyGoals?.actions?.length || 0,
      });

      onNext();
    } catch (error) {
      console.error('Error saving plan step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Enhanced loading state with progress and rotating messages
  if (isGenerating && !aiPlan) {
    const currentMessage = loadingMessages[loadingMessageIndex];

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-8">
          {/* Animated gradient background circle */}
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            {/* Outer pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 opacity-20 animate-pulse"></div>
            
            {/* Middle rotating ring */}
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin"></div>
            
            {/* Inner spinning circle */}
            <div className="absolute inset-4 rounded-full border-4 border-purple-200"></div>
            <div className="absolute inset-4 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" style={{ animationDuration: '1s' }}></div>
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl md:text-5xl animate-bounce" style={{ animationDuration: '2s' }}>
                {currentMessage.icon}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-600">Creating your plan...</span>
              <span className="text-sm font-black text-purple-600">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  style={{
                    width: '50%',
                    animation: 'shimmer 2s ease-in-out infinite',
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Rotating message */}
          <div className="text-center space-y-4">
            <h3 className="text-2xl md:text-3xl font-black bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
              Creating Your Personalized Plan
            </h3>
            <div className="min-h-[60px] flex items-center justify-center">
              <p className="text-lg md:text-xl text-gray-700 font-semibold transition-opacity duration-500">
                {currentMessage.text}
              </p>
            </div>
          </div>

          {/* Fun facts or tips while waiting */}
          <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 max-w-md">
            <p className="text-sm text-gray-600 font-medium text-center">
              💡 <span className="font-semibold">Did you know?</span> Your plan is being customized based on your specific career stage, goals, and timeline.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - no plan available and there was an error
  if (!plan && error) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">
              Unable to Generate Your Plan
            </h3>
            <p className="text-gray-600 font-medium mb-4">
              We encountered an issue while creating your personalized plan.
            </p>
            <p className="text-sm text-red-600 font-medium mb-6">{error}</p>
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="px-6 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all"
            >
              {isGenerating ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
          <div className="mt-4">
            <button
              onClick={onBack}
              className="text-gray-600 font-bold hover:text-gray-800 transition-colors"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Still loading initial plan (no error yet), or plan is null for any other reason
  // Use the same enhanced loading state
  if (!plan && !error) {
    const currentMessage = loadingMessages[loadingMessageIndex] || loadingMessages[0];

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-8">
          {/* Animated gradient background circle */}
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            {/* Outer pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 opacity-20 animate-pulse"></div>
            
            {/* Middle rotating ring */}
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin"></div>
            
            {/* Inner spinning circle */}
            <div className="absolute inset-4 rounded-full border-4 border-purple-200"></div>
            <div className="absolute inset-4 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" style={{ animationDuration: '1s' }}></div>
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl md:text-5xl animate-bounce" style={{ animationDuration: '2s' }}>
                {currentMessage.icon}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-600">Preparing your plan...</span>
              <span className="text-sm font-black text-purple-600">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  style={{
                    width: '50%',
                    animation: 'shimmer 2s ease-in-out infinite',
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Rotating message */}
          <div className="text-center space-y-4">
            <h3 className="text-2xl md:text-3xl font-black bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
              Creating Your Personalized Plan
            </h3>
            <div className="min-h-[60px] flex items-center justify-center">
              <p className="text-lg md:text-xl text-gray-700 font-semibold transition-opacity duration-500">
                {currentMessage.text}
              </p>
            </div>
          </div>

          {/* Fun facts or tips while waiting */}
          <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 max-w-md">
            <p className="text-sm text-gray-600 font-medium text-center">
              💡 <span className="font-semibold">Did you know?</span> Your plan is being customized based on your specific career stage, goals, and timeline.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // At this point, plan is guaranteed to be non-null
  // Type guard to satisfy TypeScript
  if (!plan) {
    return null; // This should never happen due to early returns above
  }

  if (!planStats) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          Your Customized Plan
        </h2>
      </div>

      {/* Summary Section */}
      <div className="mb-8">
        <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4">Summary</h3>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4 md:p-8">
          <p className="text-base md:text-lg text-gray-800 font-semibold leading-relaxed">
            {plan.summary}
          </p>
        </div>
      </div>

      {/* Plan Summary Stats */}
      <div className="mb-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Milestones Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🎯</span>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-black text-gray-900 mb-1">
                  {planStats.totalMilestones}
                </div>
                <div className="text-base md:text-lg font-semibold text-gray-700">
                  {planStats.totalMilestones === 1 ? 'Milestone' : 'Milestones'}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Actions Card */}
          <div className="bg-gradient-to-br from-pink-50 to-orange-50 border-2 border-pink-200 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">📈</span>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-black text-gray-900 mb-1">
                  {planStats.totalWeeklyActions}
                </div>
                <div className="text-base md:text-lg font-semibold text-gray-700">
                  {planStats.totalWeeklyActions === 1 ? 'Weekly Action' : 'Weekly Actions'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Target Role & Timeline Highlight */}
        <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 border-2 border-purple-300 rounded-2xl p-6 md:p-8">
          <div className="text-center space-y-3">
            <div className="text-sm md:text-base font-bold text-gray-600 uppercase tracking-wide">
              Your Goal
            </div>
            <div className="text-xl md:text-2xl font-black bg-gradient-to-br from-purple-700 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              {planStats.targetRole}
            </div>
            <div className="text-base md:text-lg font-semibold text-gray-700">
              {planStats.timeline}
            </div>
          </div>
        </div>
      </div>

      {/* Full Plan Available Message */}
      <div className="mb-8 bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2">
              Full Plan Available on Dashboard
            </h3>
            <p className="text-base md:text-lg text-gray-700 font-semibold leading-relaxed">
              Your complete personalized plan with all milestones, weekly actions, and detailed steps is ready and waiting for you on your dashboard. You can access it anytime to track your progress and stay on course toward landing your dream role.
            </p>
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
          disabled={isSaving}
          className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all text-sm md:text-base"
        >
          {isSaving ? 'Saving...' : 'Get Started on this Plan'}
        </button>
      </div>
    </div>
  );
};
