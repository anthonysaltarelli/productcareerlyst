'use client';

import { X, ArrowRight, MoveVertical, Pencil, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

type BulletChange = {
  bulletId: string;
  originalContent: string;
  newContent: string;
  wasOptimized: boolean;
  wasReordered: boolean;
  originalOrder: number;
  newOrder: number;
  changeReason?: string | null;
};

type ExperienceChange = {
  experienceId: string;
  experienceTitle: string;
  experienceCompany: string;
  bullets: BulletChange[];
};

type CustomizationSummary = {
  overallDescription?: string;
  keyChanges?: string[];
  keywordsInjected?: string[];
  bulletsReordered: number;
  bulletsOptimized: number;
  skillsAdded: number;
  originalSummary?: string | null;
  optimizedSummary?: string | null;
  summaryChangeReason?: string | null;
  bulletChanges?: ExperienceChange[];
  suggestedSkills?: Array<{
    category: string;
    skillName: string;
    reason: string;
  }>;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  customizationSummary: CustomizationSummary | null;
};

// Highlight differences between two strings
const highlightDifferences = (original: string, updated: string): { originalHighlighted: React.ReactNode; updatedHighlighted: React.ReactNode } => {
  // Simple word-based diff
  const originalWords = original.split(/(\s+)/);
  const updatedWords = updated.split(/(\s+)/);
  
  const originalSet = new Set(originalWords.filter(w => w.trim()));
  const updatedSet = new Set(updatedWords.filter(w => w.trim()));
  
  const originalHighlighted = originalWords.map((word, i) => {
    if (word.trim() && !updatedSet.has(word)) {
      return <span key={i} className="bg-red-200 text-red-800 rounded px-0.5">{word}</span>;
    }
    return <span key={i}>{word}</span>;
  });
  
  const updatedHighlighted = updatedWords.map((word, i) => {
    if (word.trim() && !originalSet.has(word)) {
      return <span key={i} className="bg-green-200 text-green-800 rounded px-0.5">{word}</span>;
    }
    return <span key={i}>{word}</span>;
  });
  
  return { originalHighlighted, updatedHighlighted };
};

const BulletComparisonModal = ({ isOpen, onClose, customizationSummary }: Props) => {
  const [expandedExperiences, setExpandedExperiences] = useState<Set<string>>(new Set());
  const [showSummaryComparison, setShowSummaryComparison] = useState(false);

  if (!isOpen || !customizationSummary) return null;

  const { bulletChanges, originalSummary, optimizedSummary, summaryChangeReason, suggestedSkills } = customizationSummary;

  const toggleExperience = (expId: string) => {
    const newExpanded = new Set(expandedExperiences);
    if (newExpanded.has(expId)) {
      newExpanded.delete(expId);
    } else {
      newExpanded.add(expId);
    }
    setExpandedExperiences(newExpanded);
  };

  const hasBulletChanges = bulletChanges && bulletChanges.length > 0;
  const hasSummaryChange = originalSummary && optimizedSummary && originalSummary !== optimizedSummary;
  const hasSkillChanges = suggestedSkills && suggestedSkills.length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
    >
      <div className="rounded-[2.5rem] bg-white shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-400 max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-[0_4px_0_0_rgba(147,51,234,0.4)]">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 id="comparison-title" className="text-2xl font-black text-gray-900">
                AI Customization Changes
              </h2>
              <p className="text-gray-600 font-semibold">
                Review what was changed in your resume
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-[1rem]"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-[1.25rem] bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MoveVertical className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-black text-blue-700">{customizationSummary.bulletsReordered}</span>
            </div>
            <p className="text-xs font-bold text-blue-600">Bullets Reordered</p>
          </div>
          <div className="p-4 rounded-[1.25rem] bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Pencil className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-black text-purple-700">{customizationSummary.bulletsOptimized}</span>
            </div>
            <p className="text-xs font-bold text-purple-600">Bullets Optimized</p>
          </div>
          <div className="p-4 rounded-[1.25rem] bg-gradient-to-br from-orange-100 to-yellow-100 border-2 border-orange-300 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span className="text-2xl font-black text-orange-700">{customizationSummary.skillsAdded}</span>
            </div>
            <p className="text-xs font-bold text-orange-600">Skills Added</p>
          </div>
        </div>

        {/* Summary Comparison */}
        {hasSummaryChange && (
          <div className="mb-6">
            <button
              onClick={() => setShowSummaryComparison(!showSummaryComparison)}
              className="w-full p-4 rounded-[1.25rem] bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 flex items-center justify-between hover:from-amber-100 hover:to-orange-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[0.75rem] bg-amber-200 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-amber-700" />
                </div>
                <div className="text-left">
                  <h3 className="font-black text-gray-900">Professional Summary Changed</h3>
                  <p className="text-sm text-gray-600 font-medium">{summaryChangeReason || 'Click to view changes'}</p>
                </div>
              </div>
              {showSummaryComparison ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {showSummaryComparison && (
              <div className="mt-3 p-4 rounded-[1rem] bg-gray-50 border-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-black text-red-600 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Original
                    </h4>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed bg-red-50 p-3 rounded-[0.75rem] border border-red-200">
                      {originalSummary}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-green-600 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Optimized
                    </h4>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed bg-green-50 p-3 rounded-[0.75rem] border border-green-200">
                      {optimizedSummary}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bullet Changes by Experience */}
        {hasBulletChanges && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-purple-600" />
              Bullet Point Changes
            </h3>

            <div className="space-y-3">
              {bulletChanges.map((expChange) => {
                const isExpanded = expandedExperiences.has(expChange.experienceId);
                const optimizedCount = expChange.bullets.filter(b => b.wasOptimized).length;
                const reorderedCount = expChange.bullets.filter(b => b.wasReordered).length;

                return (
                  <div
                    key={expChange.experienceId}
                    className="rounded-[1.25rem] border-2 border-gray-300 overflow-hidden"
                  >
                    {/* Experience Header */}
                    <button
                      onClick={() => toggleExperience(expChange.experienceId)}
                      className="w-full p-4 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-between hover:from-gray-100 hover:to-gray-150 transition-colors"
                    >
                      <div className="text-left">
                        <h4 className="font-black text-gray-900">{expChange.experienceTitle}</h4>
                        <p className="text-sm text-gray-600 font-semibold">{expChange.experienceCompany}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {optimizedCount > 0 && (
                            <span className="px-2 py-1 rounded-[0.5rem] bg-purple-100 text-purple-700 text-xs font-bold">
                              {optimizedCount} optimized
                            </span>
                          )}
                          {reorderedCount > 0 && (
                            <span className="px-2 py-1 rounded-[0.5rem] bg-blue-100 text-blue-700 text-xs font-bold">
                              {reorderedCount} reordered
                            </span>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Bullet Details */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 bg-white">
                        {expChange.bullets.map((bullet, idx) => {
                          const { originalHighlighted, updatedHighlighted } = bullet.wasOptimized
                            ? highlightDifferences(bullet.originalContent, bullet.newContent)
                            : { originalHighlighted: bullet.originalContent, updatedHighlighted: bullet.newContent };

                          return (
                            <div
                              key={bullet.bulletId}
                              className="p-4 rounded-[1rem] bg-gray-50 border-2 border-gray-200"
                            >
                              {/* Change badges */}
                              <div className="flex items-center gap-2 mb-3">
                                {bullet.wasOptimized && (
                                  <span className="px-2 py-1 rounded-[0.5rem] bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1">
                                    <Pencil className="w-3 h-3" />
                                    Content Changed
                                  </span>
                                )}
                                {bullet.wasReordered && (
                                  <span className="px-2 py-1 rounded-[0.5rem] bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1">
                                    <MoveVertical className="w-3 h-3" />
                                    #{bullet.originalOrder + 1} → #{bullet.newOrder + 1}
                                  </span>
                                )}
                              </div>

                              {/* Content comparison */}
                              {bullet.wasOptimized ? (
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="text-xs font-black text-red-600 mb-1 flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                      Original
                                    </h5>
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed p-3 rounded-[0.75rem] bg-red-50 border border-red-200">
                                      {originalHighlighted}
                                    </p>
                                  </div>
                                  <div className="flex justify-center">
                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-black text-green-600 mb-1 flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                      Optimized
                                    </h5>
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed p-3 rounded-[0.75rem] bg-green-50 border border-green-200">
                                      {updatedHighlighted}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                  {bullet.newContent}
                                </p>
                              )}

                              {/* Change reason */}
                              {bullet.changeReason && (
                                <div className="mt-3 p-3 rounded-[0.75rem] bg-amber-50 border border-amber-200">
                                  <p className="text-xs font-bold text-amber-700">
                                    💡 Why: {bullet.changeReason}
                                  </p>
                                </div>
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
        )}

        {/* Skills Added */}
        {hasSkillChanges && (
          <div className="mb-6">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-600" />
              Skills Added
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-[1rem] bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded-[0.5rem] bg-orange-200 text-orange-700 text-xs font-bold capitalize">
                      {skill.category}
                    </span>
                    <span className="font-black text-gray-900">{skill.skillName}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{skill.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No changes message */}
        {!hasBulletChanges && !hasSummaryChange && !hasSkillChanges && (
          <div className="p-8 rounded-[1.5rem] bg-gray-50 border-2 border-gray-200 text-center">
            <p className="text-gray-600 font-semibold">No detailed changes to display.</p>
          </div>
        )}

        {/* Close button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3.5 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulletComparisonModal;

