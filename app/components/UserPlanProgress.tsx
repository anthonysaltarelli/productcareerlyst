'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Circle, ChevronDown, ChevronUp, Target, Rocket, HelpCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { UserPlanData } from '@/app/api/dashboard/plan/route';
import { Tooltip } from '@/app/components/ui/Tooltip';
import { getBaselineActionInfo, getWeeklyGoalInfo } from '@/lib/utils/goal-explanations';

interface UserPlanProgressProps {
  planData: UserPlanData | null;
}

// Group baseline actions by section
function groupBaselineActions(
  actions: UserPlanData['baselineActions']
): Map<string, UserPlanData['baselineActions']> {
  const grouped = new Map<string, UserPlanData['baselineActions']>();
  for (const action of actions) {
    const existing = grouped.get(action.sectionTitle) || [];
    existing.push(action);
    grouped.set(action.sectionTitle, existing);
  }
  return grouped;
}

// Format timeline for display
function formatTimeline(timeline: string | null): string {
  if (!timeline) return '';
  const timelineMap: Record<string, string> = {
    '1_month': '1 month',
    '3_months': '3 months',
    '6_months': '6 months',
    '12_months': '12 months',
    '1_year': '1 year',
  };
  return timelineMap[timeline] || timeline;
}

// Format target role for display (convert old enum to human-readable, or return as-is for new format)
function formatTargetRole(role: string | null): string {
  if (!role) return '';
  // Legacy enum mappings for backwards compatibility
  const legacyRoleMap: Record<string, string> = {
    'associate_product_manager': 'Associate Product Manager',
    'product_manager': 'Product Manager',
    'senior_product_manager': 'Senior Product Manager',
    'director_of_product': 'Director of Product',
    'group_product_manager': 'Group Product Manager',
    'vp_of_product': 'VP of Product',
    'chief_product_officer': 'Chief Product Officer',
  };
  // Return mapped value for legacy enums, or the role as-is for new format
  return legacyRoleMap[role] || role;
}

export const UserPlanProgress = ({ planData }: UserPlanProgressProps) => {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showCompletedBaseline, setShowCompletedBaseline] = useState(false);
  const [togglingActions, setTogglingActions] = useState<Set<string>>(new Set());
  const [optimisticState, setOptimisticState] = useState<Map<string, boolean>>(new Map());

  // Toggle baseline action completion
  const toggleBaselineAction = useCallback(async (actionId: string, currentState: boolean) => {
    const newState = !currentState;

    // Set loading state
    setTogglingActions(prev => new Set(prev).add(actionId));

    // Optimistic update
    setOptimisticState(prev => new Map(prev).set(actionId, newState));

    try {
      const response = await fetch('/api/goals/baseline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, isCompleted: newState }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      const data = await response.json();

      toast.success(newState ? 'Action marked as complete!' : 'Action marked as incomplete');

      // If all complete status changed, refresh the page to update the layout
      if (data.allComplete !== planData?.baselineAllComplete) {
        router.refresh();
      }
    } catch {
      // Revert optimistic update on error
      setOptimisticState(prev => {
        const newMap = new Map(prev);
        newMap.delete(actionId);
        return newMap;
      });
      toast.error('Failed to update action. Please try again.');
    } finally {
      setTogglingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  }, [planData?.baselineAllComplete, router]);

  // Get the effective completion state (optimistic or actual)
  const getActionCompletedState = useCallback((actionId: string, actualState: boolean): boolean => {
    return optimisticState.has(actionId) ? optimisticState.get(actionId)! : actualState;
  }, [optimisticState]);

  // Don't render if no plan
  if (!planData || !planData.hasPlan) {
    return null;
  }

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionTitle)) {
        newSet.delete(sectionTitle);
      } else {
        newSet.add(sectionTitle);
      }
      return newSet;
    });
  };

  // Calculate baseline progress
  const totalBaseline = planData.baselineActions.length;
  const completedBaseline = planData.baselineActions.filter((a) => a.isCompleted).length;
  const baselinePercentage = totalBaseline > 0 ? Math.round((completedBaseline / totalBaseline) * 100) : 0;

  // Calculate weekly goals progress
  const enabledGoals = planData.weeklyGoals.filter((g) => g.isEnabled);
  const weeklyProgressMap = new Map(
    planData.weeklyProgress.map((p) => [p.goalId, p])
  );

  // Group baseline actions by section
  const groupedBaseline = groupBaselineActions(planData.baselineActions);
  const sectionTitles = Array.from(groupedBaseline.keys());

  // Calculate section completion
  const getSectionCompletion = (sectionTitle: string) => {
    const actions = groupedBaseline.get(sectionTitle) || [];
    const completed = actions.filter((a) => a.isCompleted).length;
    return { completed, total: actions.length };
  };

  return (
    <div className="mb-8">
      {/* Plan Summary Header */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-indigo-200 shadow-[0_12px_0_0_rgba(99,102,241,0.2)] mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">Your Plan</h2>
              {planData.targetRole && (
                <p className="text-sm font-semibold text-indigo-600">
                  Target: {formatTargetRole(planData.targetRole)}
                  {planData.timeline && ` • ${formatTimeline(planData.timeline)}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl bg-white/80 border border-indigo-200">
              <span className="text-sm font-bold text-gray-700">
                {baselinePercentage}% Complete
              </span>
            </div>
          </div>
        </div>
        {planData.summary && (
          <p className="text-gray-700 font-medium leading-relaxed">{planData.summary}</p>
        )}
      </div>

      {/* Conditional layout based on baseline completion */}
      {planData.baselineAllComplete ? (
        <>
          {/* Full-width Weekly Goals Dashboard */}
          <div className="p-6 rounded-[1.5rem] bg-white border-2 border-gray-200 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-gray-900">This Week&apos;s Goals</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-500">
                  {enabledGoals.filter(g => {
                    const progress = weeklyProgressMap.get(g.goalId);
                    const current = progress?.currentCount || 0;
                    const target = progress?.targetCount || g.targetCount;
                    return current >= target;
                  }).length}/{enabledGoals.length} complete
                </span>
              </div>
            </div>

            {planData.weeklyGoalsDescription && (
              <p className="text-sm text-gray-600 font-medium mb-6">
                {planData.weeklyGoalsDescription}
              </p>
            )}

            {enabledGoals.length === 0 ? (
              <p className="text-sm text-gray-500 font-medium">No weekly goals set.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enabledGoals.map((goal) => {
                  const progress = weeklyProgressMap.get(goal.goalId);
                  const current = progress?.currentCount || 0;
                  const target = progress?.targetCount || goal.targetCount;
                  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                  const isComplete = current >= target;
                  const goalInfo = getWeeklyGoalInfo(goal.goalId);

                  return (
                    <div
                      key={goal.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isComplete
                          ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
                          : 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          {isComplete ? (
                            <div className="p-2 rounded-lg bg-green-100">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-indigo-100">
                              <Circle className="w-5 h-5 text-indigo-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {goalInfo?.route ? (
                              <Link
                                href={goalInfo.route}
                                className={`font-bold text-base block transition-all ${
                                  isComplete
                                    ? 'text-green-800'
                                    : 'text-gray-900 hover:text-indigo-600'
                                }`}
                              >
                                {goal.label}
                              </Link>
                            ) : (
                              <span
                                className={`font-bold text-base block ${
                                  isComplete ? 'text-green-800' : 'text-gray-900'
                                }`}
                              >
                                {goal.label}
                              </span>
                            )}
                            {goalInfo?.explanation && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {goalInfo.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {goalInfo?.explanation && (
                            <Tooltip content={goalInfo.explanation} position="top">
                              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              isComplete
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-bold min-w-[3rem] text-right ${
                            isComplete ? 'text-green-600' : 'text-gray-700'
                          }`}
                        >
                          {current}/{target}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Baseline - Collapsible Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <button
              onClick={() => setShowCompletedBaseline(!showCompletedBaseline)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <p className="font-bold text-green-800">All baseline actions complete!</p>
                  <p className="text-sm text-green-700">
                    Great job setting up your foundation. {completedBaseline} actions completed.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                {showCompletedBaseline ? (
                  <>
                    <span className="text-sm font-medium">Hide details</span>
                    <EyeOff className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium">View details</span>
                    <Eye className="w-5 h-5" />
                  </>
                )}
              </div>
            </button>

            {/* Expandable completed baseline actions */}
            {showCompletedBaseline && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sectionTitles.map((sectionTitle) => {
                    const actions = groupedBaseline.get(sectionTitle) || [];
                    const { completed, total } = getSectionCompletion(sectionTitle);

                    return (
                      <div
                        key={sectionTitle}
                        className="p-3 rounded-lg bg-white/60 border border-green-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="font-bold text-sm text-green-800">
                            {sectionTitle}
                          </span>
                          <span className="text-xs text-green-600 ml-auto">
                            {completed}/{total}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {actions.map((action) => {
                            const isCompleted = getActionCompletedState(action.actionId, action.isCompleted);
                            const isToggling = togglingActions.has(action.actionId);
                            return (
                              <div
                                key={action.id}
                                className="flex items-center gap-2 text-xs text-green-700"
                              >
                                <button
                                  onClick={() => toggleBaselineAction(action.actionId, isCompleted)}
                                  disabled={isToggling}
                                  className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 rounded-full disabled:opacity-50"
                                  aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                                >
                                  {isToggling ? (
                                    <Loader2 className="w-3 h-3 text-green-500 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3 hover:text-green-800 cursor-pointer" />
                                  )}
                                </button>
                                <span className="line-through opacity-75">{action.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Baseline Actions Section */}
          <div className="p-6 rounded-[1.5rem] bg-white border-2 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-black text-gray-900">Get Started</h3>
              </div>
              <span className="text-sm font-semibold text-gray-500">
                {completedBaseline}/{totalBaseline} done
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${baselinePercentage}%` }}
              />
            </div>

            <div className="space-y-3">
              {sectionTitles.map((sectionTitle) => {
                const actions = groupedBaseline.get(sectionTitle) || [];
                const { completed, total } = getSectionCompletion(sectionTitle);
                const isExpanded = expandedSections.has(sectionTitle);
                const allComplete = completed === total;

                return (
                  <div
                    key={sectionTitle}
                    className={`rounded-xl border-2 transition-all ${
                      allComplete
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-gray-200 bg-gray-50/50'
                    }`}
                  >
                    <button
                      onClick={() => toggleSection(sectionTitle)}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        {allComplete ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span
                          className={`font-bold text-sm ${
                            allComplete ? 'text-green-800' : 'text-gray-900'
                          }`}
                        >
                          {sectionTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">
                          {completed}/{total}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        {actions.map((action) => {
                          const actionInfo = getBaselineActionInfo(action.actionId);
                          const isCompleted = getActionCompletedState(action.actionId, action.isCompleted);
                          const isToggling = togglingActions.has(action.actionId);
                          return (
                            <div
                              key={action.id}
                              className={`flex items-start gap-2 p-2 rounded-lg ${
                                isCompleted ? 'bg-green-100/50' : 'bg-white'
                              }`}
                            >
                              <button
                                onClick={() => toggleBaselineAction(action.actionId, isCompleted)}
                                disabled={isToggling}
                                className="flex-shrink-0 mt-0.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 rounded-full disabled:opacity-50"
                                aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                                ) : isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-600 hover:text-green-700 cursor-pointer" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-300 hover:text-purple-500 cursor-pointer" />
                                )}
                              </button>
                              {actionInfo?.route ? (
                                <Link
                                  href={actionInfo.route}
                                  className={`text-sm font-medium flex-1 transition-all ${
                                    isCompleted
                                      ? 'text-green-800 line-through'
                                      : 'text-gray-700 hover:text-purple-600 hover:font-bold hover:underline'
                                  }`}
                                >
                                  {action.label}
                                </Link>
                              ) : (
                                <span
                                  className={`text-sm font-medium flex-1 ${
                                    isCompleted
                                      ? 'text-green-800 line-through'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {action.label}
                                </span>
                              )}
                              {actionInfo?.explanation && (
                                <Tooltip content={actionInfo.explanation} position="left">
                                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0" />
                                </Tooltip>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Goals Section */}
          <div className="p-6 rounded-[1.5rem] bg-white border-2 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-gray-900">This Week&apos;s Goals</h3>
              </div>
            </div>

            {planData.weeklyGoalsDescription && (
              <p className="text-sm text-gray-600 font-medium mb-4">
                {planData.weeklyGoalsDescription}
              </p>
            )}

            {enabledGoals.length === 0 ? (
              <p className="text-sm text-gray-500 font-medium">No weekly goals set.</p>
            ) : (
              <div className="space-y-3">
                {enabledGoals.map((goal) => {
                  const progress = weeklyProgressMap.get(goal.goalId);
                  const current = progress?.currentCount || 0;
                  const target = progress?.targetCount || goal.targetCount;
                  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                  const isComplete = current >= target;
                  const goalInfo = getWeeklyGoalInfo(goal.goalId);

                  return (
                    <div
                      key={goal.id}
                      className={`p-3 rounded-xl border-2 ${
                        isComplete
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-start gap-2 flex-1">
                          {isComplete ? (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          )}
                          {goalInfo?.route ? (
                            <Link
                              href={goalInfo.route}
                              className={`font-bold text-sm transition-all flex-1 ${
                                isComplete
                                  ? 'text-green-800'
                                  : 'text-gray-900 hover:text-purple-600 hover:underline'
                              }`}
                            >
                              {goal.label}
                            </Link>
                          ) : (
                            <span
                              className={`font-bold text-sm flex-1 ${
                                isComplete ? 'text-green-800' : 'text-gray-900'
                              }`}
                            >
                              {goal.label}
                            </span>
                          )}
                          {goalInfo?.explanation && (
                            <Tooltip content={goalInfo.explanation} position="top">
                              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help flex-shrink-0 mt-0.5" />
                            </Tooltip>
                          )}
                        </div>
                        <span
                          className={`text-sm font-bold flex-shrink-0 ml-2 ${
                            isComplete ? 'text-green-600' : 'text-gray-600'
                          }`}
                        >
                          {current}/{target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isComplete
                              ? 'bg-green-500'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
