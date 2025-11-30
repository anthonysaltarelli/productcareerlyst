'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Circle, ChevronDown, ChevronUp, Target, Rocket, HelpCircle } from 'lucide-react';
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

// Format target role for display (convert enum to human-readable)
function formatTargetRole(role: string | null): string {
  if (!role) return '';
  const roleMap: Record<string, string> = {
    'associate_product_manager': 'Associate Product Manager',
    'product_manager': 'Product Manager',
    'senior_product_manager': 'Senior Product Manager',
    'director_of_product': 'Director of Product',
    'group_product_manager': 'Group Product Manager',
    'vp_of_product': 'VP of Product',
    'chief_product_officer': 'Chief Product Officer',
  };
  return roleMap[role] || role;
}

export const UserPlanProgress = ({ planData }: UserPlanProgressProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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

          {/* Baseline All Complete State */}
          {planData.baselineAllComplete ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-bold text-green-800">All baseline actions complete!</p>
                  <p className="text-sm text-green-700">
                    Great job setting up your foundation.
                  </p>
                </div>
              </div>
            </div>
          ) : (
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
                          return (
                            <div
                              key={action.id}
                              className={`flex items-start gap-2 p-2 rounded-lg ${
                                action.isCompleted ? 'bg-green-100/50' : 'bg-white'
                              }`}
                            >
                              {action.isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                              )}
                              {actionInfo?.route ? (
                                <Link
                                  href={actionInfo.route}
                                  className={`text-sm font-medium flex-1 transition-all ${
                                    action.isCompleted
                                      ? 'text-green-800 line-through'
                                      : 'text-gray-700 hover:text-purple-600 hover:font-bold hover:underline'
                                  }`}
                                >
                                  {action.label}
                                </Link>
                              ) : (
                                <span
                                  className={`text-sm font-medium flex-1 ${
                                    action.isCompleted
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
          )}
        </div>

        {/* Weekly Goals Section */}
        <div className="p-6 rounded-[1.5rem] bg-white border-2 border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-black text-gray-900">This Week's Goals</h3>
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
    </div>
  );
};
