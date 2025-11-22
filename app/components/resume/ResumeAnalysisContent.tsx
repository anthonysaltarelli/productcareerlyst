"use client";

import { useState, useEffect } from "react";
import { scoreToGrade, getGradeColor, getGradeTextColor } from "@/lib/utils/gradeUtils";

type CategoryScore = {
  actionVerbs: number;
  accomplishments: number;
  quantification: number;
  impact: number;
  conciseness: number;
};

type KeywordItem = {
  keyword: string;
  count?: number;
  priority?: 'high' | 'medium' | 'low';
};

type Recommendation = {
  priority: number;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
};

type AnalysisData = {
  overallScore: number;
  categoryScores: CategoryScore;
  keywordAnalysis: {
    present: KeywordItem[];
    missing: KeywordItem[];
    density: number;
  };
  atsCompatibility: 'Good' | 'Fair' | 'Poor';
  atsExplanation: string;
  recommendations: Recommendation[];
  categoryDescriptions: {
    actionVerbs: string;
    accomplishments: string;
    quantification: string;
    impact: string;
    conciseness: string;
  };
  createdAt?: string;
};

type Props = {
  analysis: AnalysisData | null;
  isLoading?: boolean;
  error?: string | null;
  onReAnalyze?: () => Promise<void>;
  usageRemaining?: number;
  usageLimit?: number;
  userPlan?: 'learn' | 'accelerate' | null;
  isAnalyzing?: boolean;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
  if (impact === 'high') return 'text-red-600 bg-red-100 border-red-300';
  if (impact === 'medium') return 'text-orange-600 bg-orange-100 border-orange-300';
  return 'text-yellow-600 bg-yellow-100 border-yellow-300';
};

const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
  if (priority === 'high') return 'text-red-700 bg-red-50 border-red-200';
  if (priority === 'medium') return 'text-orange-700 bg-orange-50 border-orange-200';
  return 'text-yellow-700 bg-yellow-50 border-yellow-200';
};

const getATSColor = (compatibility: 'Good' | 'Fair' | 'Poor') => {
  if (compatibility === 'Good') return 'text-green-700 bg-green-100 border-green-300';
  if (compatibility === 'Fair') return 'text-yellow-700 bg-yellow-100 border-yellow-300';
  return 'text-red-700 bg-red-100 border-red-300';
};

const LOADING_MESSAGES = [
  { text: "Analyzing your resume structure and formatting...", icon: "📄" },
  { text: "Evaluating action verbs and language quality...", icon: "✨" },
  { text: "Assessing accomplishments and quantifiable results...", icon: "📊" },
  { text: "Reviewing impact and business value demonstration...", icon: "🎯" },
  { text: "Scanning for Product Management keywords...", icon: "🔍" },
  { text: "Checking ATS compatibility and optimization...", icon: "🤖" },
  { text: "Analyzing conciseness and clarity...", icon: "✂️" },
  { text: "Generating personalized recommendations...", icon: "💡" },
  { text: "Calculating overall score and category breakdowns...", icon: "📈" },
  { text: "Finalizing comprehensive analysis report...", icon: "🎉" },
];

export default function ResumeAnalysisContent({
  analysis,
  isLoading = false,
  error = null,
  onReAnalyze,
  usageRemaining = 30,
  usageLimit = 30,
  userPlan = null,
  isAnalyzing = false,
}: Props) {
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<number>>(new Set());
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);

  // Progress through loading messages (6 seconds each, stay on last one)
  useEffect(() => {
    if (!isLoading) {
      setCurrentLoadingMessage(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentLoadingMessage((prev) => {
        // Stay on the last message once we reach it
        if (prev >= LOADING_MESSAGES.length - 1) {
          return prev;
        }
        return prev + 1;
      });
    }, 6000); // Change message every 6 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  const toggleRecommendation = (priority: number) => {
    const newExpanded = new Set(expandedRecommendations);
    if (newExpanded.has(priority)) {
      newExpanded.delete(priority);
    } else {
      newExpanded.add(priority);
    }
    setExpandedRecommendations(newExpanded);
  };

  if (isLoading) {
    const currentMessage = LOADING_MESSAGES[currentLoadingMessage];
    
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-16 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mb-6 border-2 border-blue-300">
          <svg className="animate-spin h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Analyzing Your Resume</h3>
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-3xl">{currentMessage.icon}</span>
          <p className="text-lg text-gray-700 font-semibold">{currentMessage.text}</p>
        </div>
        <div className="mt-6 flex items-center justify-center gap-1">
          {LOADING_MESSAGES.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-500 ${
                index === currentLoadingMessage
                  ? 'bg-blue-600 w-8'
                  : index < currentLoadingMessage
                  ? 'bg-blue-300'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-4">This comprehensive analysis may take up to 60 seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border-2 border-red-200 p-16 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl mb-6 border-2 border-red-300">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Analysis Error</h3>
        <p className="text-gray-600 font-medium mb-6">{error}</p>
        {onReAnalyze && (
          <button
            onClick={onReAnalyze}
            disabled={isAnalyzing || usageRemaining === 0}
            className="px-6 py-3 bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-16 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl mb-6 border-2 border-slate-300">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">No Analysis Yet</h3>
        <p className="text-gray-600 font-medium mb-6">
          Click "Analyze Resume" in the sidebar to get started
        </p>
        {onReAnalyze && (
          <button
            onClick={onReAnalyze}
            disabled={isAnalyzing || usageRemaining === 0}
            className="px-6 py-3 bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Resume
          </button>
        )}
      </div>
    );
  }

  const grade = scoreToGrade(analysis.overallScore);
  const gradeColor = getGradeColor(grade);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Analysis</h2>
            {analysis.createdAt && (
              <p className="text-sm text-gray-600">Analyzed on {formatDate(analysis.createdAt)}</p>
            )}
            {usageRemaining !== undefined && userPlan === 'accelerate' && (
              <p className="text-xs text-gray-500 mt-1">
                {usageRemaining} of {usageLimit} analyses remaining this month
              </p>
            )}
          </div>
          {onReAnalyze && (
            <button
              onClick={onReAnalyze}
              disabled={isAnalyzing || usageRemaining === 0}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
                isAnalyzing || usageRemaining === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-md'
              }`}
            >
              {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
            </button>
          )}
        </div>

        {/* Overall Score */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">
              Overall Score
            </span>
            <span className="text-4xl font-black bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {analysis.overallScore}
            </span>
          </div>
          <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all"
              style={{ width: `${analysis.overallScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Category Scores</h3>
        <div className="space-y-4">
          {Object.entries(analysis.categoryScores).map(([key, score]) => {
            const categoryGrade = scoreToGrade(score);
            const categoryColor = getGradeColor(categoryGrade);
            const description = analysis.categoryDescriptions[key as keyof typeof analysis.categoryDescriptions];
            const categoryName = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();

            return (
              <div
                key={key}
                className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-bold text-gray-700">{categoryName}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold px-3 py-1 rounded border ${categoryColor}`}>
                      {categoryGrade}
                    </span>
                    <span className="text-xl font-black text-gray-900">{score}</span>
                  </div>
                </div>
                <div className="w-full bg-white/50 rounded-full h-2.5 overflow-hidden mb-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyword Analysis */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Keyword Analysis</h3>
        
        <div className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200">
          {(() => {
            const presentKeywords = analysis.keywordAnalysis.present.filter(item => (item.count || 0) > 0).length;
            const totalExpected = presentKeywords + analysis.keywordAnalysis.missing.length;
            const coverage = totalExpected > 0 ? Math.round((presentKeywords / totalExpected) * 100) : 0;
            
            return (
              <div>
                <span className="text-sm font-bold text-gray-700">PM Keywords Found</span>
                <p className="text-lg font-bold text-gray-900 mt-2">
                  {presentKeywords} of {totalExpected} expected keywords ({coverage}% coverage)
                </p>
              </div>
            );
          })()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Present Keywords */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3">Present Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.keywordAnalysis.present.filter(item => (item.count || 0) > 0).length > 0 ? (
                analysis.keywordAnalysis.present
                  .filter(item => (item.count || 0) > 0)
                  .sort((a, b) => (b.count || 0) - (a.count || 0))
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="font-semibold">{item.keyword}</span>
                      {item.count !== undefined && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold text-[10px]">
                          {item.count}
                        </span>
                      )}
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500">No keywords found</p>
              )}
            </div>
          </div>

          {/* Missing Keywords */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3">Missing Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.keywordAnalysis.missing.length > 0 ? (
                analysis.keywordAnalysis.missing
                  .sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];
                  })
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-shadow ${getPriorityColor(item.priority || 'low')}`}
                    >
                      {item.keyword}
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500">All expected keywords present!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ATS Compatibility */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">ATS Compatibility</h3>
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-sm font-bold px-3 py-1.5 rounded border ${getATSColor(analysis.atsCompatibility)}`}>
            {analysis.atsCompatibility}
          </span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{analysis.atsExplanation}</p>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recommendations</h3>
        <div className="space-y-3">
          {analysis.recommendations
            .sort((a, b) => a.priority - b.priority)
            .map((rec, index) => {
              const isExpanded = expandedRecommendations.has(rec.priority);
              return (
                <div
                  key={rec.priority}
                  className="border-2 border-slate-200 rounded-xl overflow-hidden bg-gradient-to-br from-white to-slate-50 hover:border-blue-300 hover:shadow-md transition-all duration-200 animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <button
                    onClick={() => toggleRecommendation(rec.priority)}
                    className="w-full p-5 text-left transition-all flex items-start justify-between group"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl flex items-center justify-center font-bold text-base shadow-sm">
                        {rec.priority}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="text-base font-bold text-gray-900 leading-snug pr-2">{rec.title}</h4>
                          <span className={`text-xs font-bold px-3 py-1 rounded-lg border flex-shrink-0 flex items-center justify-center mr-3 ${getImpactColor(rec.impact)}`}>
                            {rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)}
                          </span>
                        </div>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
                          }`}
                        >
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{rec.description}</p>
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-all duration-300 flex-shrink-0 mt-1 group-hover:text-gray-600 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-5 pt-0 border-t border-slate-100">
                      <p className="text-sm text-gray-600 leading-relaxed pt-4">{rec.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

