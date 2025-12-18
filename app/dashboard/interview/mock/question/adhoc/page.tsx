'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { X, Video, Clock, Loader2, AlertTriangle, Mic, Building2, Briefcase } from 'lucide-react';
import { BetaAccessModal } from '@/app/components/BetaAccessModal';

interface AdHocQuestion {
  question: string;
  category: string;
  source?: {
    type: 'job_specific';
    companyName: string;
    jobTitle: string;
  };
}

export default function AdHocQuestionSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { aiVideoCoach } = useFlags();

  const [questionData, setQuestionData] = useState<AdHocQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [hasBetaAccess, setHasBetaAccess] = useState<boolean | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);

  // Parse question data from URL params
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (!qParam) {
      setError('No question data provided');
      setLoading(false);
      return;
    }

    try {
      const decoded = atob(qParam);
      const parsed = JSON.parse(decoded) as AdHocQuestion;

      if (!parsed.question || !parsed.category) {
        setError('Invalid question data');
        setLoading(false);
        return;
      }

      setQuestionData(parsed);
      setLoading(false);
    } catch {
      setError('Failed to parse question data');
      setLoading(false);
    }
  }, [searchParams]);

  // Feature flag check
  useEffect(() => {
    if (aiVideoCoach === false) {
      router.replace('/dashboard/interview');
    }
  }, [aiVideoCoach, router]);

  // Check beta access on mount
  useEffect(() => {
    const checkBetaAccess = async () => {
      try {
        const response = await fetch('/api/user/beta-access');
        if (response.ok) {
          const data = await response.json();
          setHasBetaAccess(data.hasAiVideoCoachBeta);
        } else {
          setHasBetaAccess(false);
        }
      } catch {
        setHasBetaAccess(false);
      }
    };

    checkBetaAccess();
  }, []);

  const handleExitClick = () => {
    // If we have source info, go back to that interview's feedback page
    // Otherwise, go to the interview prep page
    router.back();
  };

  const handleStartPractice = async () => {
    if (!questionData || starting) return;

    // Check beta access before starting
    if (!hasBetaAccess) {
      setShowBetaModal(true);
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/mock-interviews/quick-question/start-adhoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start practice session');
      }

      const data = await response.json();

      // Encode credentials for URL
      const credentials = btoa(
        JSON.stringify({
          url: data.livekitUrl,
          token: data.livekitToken,
        })
      );

      // Navigate to the video call page with credentials and question context
      router.push(
        `/dashboard/interview/mock/${data.interviewId}?credentials=${credentials}&mode=quick_question`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start practice session');
      setStarting(false);
    }
  };

  // Format category for display
  const formatCategory = (category: string): string => {
    switch (category) {
      case 'company':
        return 'Company Fit';
      case 'role':
        return 'Role Specific';
      case 'industry':
        return 'Industry Knowledge';
      case 'behavioral':
        return 'Behavioral';
      case 'product_sense':
        return 'Product Sense';
      default:
        return category;
    }
  };

  // Loading state - full screen
  if (loading || aiVideoCoach === undefined || hasBetaAccess === null) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Loading question...</p>
        </div>
      </div>
    );
  }

  // Error state - full screen
  if (error && !questionData) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 pointer-events-none" />

        {/* Header with Exit button */}
        <div className="relative z-10 flex items-center justify-between p-4 md:p-6">
          <button
            onClick={handleExitClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="hidden md:inline font-medium">Exit</span>
          </button>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-400 font-bold text-xl mb-4">Error</p>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={handleExitClick}
              className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold hover:bg-slate-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-y-auto">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 pointer-events-none" />

      {/* Header with Exit button */}
      <div className="relative z-10 flex items-center justify-between p-4 md:p-6 flex-shrink-0">
        <button
          onClick={handleExitClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="hidden md:inline font-medium">Exit</span>
        </button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
          <Clock className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 font-medium text-sm">5 min practice</span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
              <Mic className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
              Practice This Question
            </h1>
            {questionData?.source && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium text-sm">
                  <Building2 className="w-4 h-4" />
                  {questionData.source.companyName}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium text-sm">
                  <Briefcase className="w-4 h-4" />
                  {questionData.source.jobTitle}
                </div>
              </div>
            )}
            <p className="text-lg text-gray-400 max-w-lg mx-auto">
              {questionData?.source
                ? `Practice this question from your ${questionData.source.companyName} interview`
                : 'Practice this question with AI-powered feedback'}
            </p>
          </div>

          {/* Question Card */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 px-6 py-4">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wide mb-2">
                {formatCategory(questionData?.category || '')}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                {questionData?.question}
              </h2>
            </div>
            <div className="px-6 py-5 border-t border-slate-700">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wide mb-2">
                Tips for Answering
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {questionData?.category === 'company' && (
                  <>Show genuine enthusiasm and specific knowledge about the company. Reference their products, culture, recent news, or mission. Connect your career goals to what the company offers.</>
                )}
                {questionData?.category === 'role' && (
                  <>Highlight relevant experience that directly maps to this role. Use specific examples and metrics. Show you understand the responsibilities and challenges of the position.</>
                )}
                {questionData?.category === 'industry' && (
                  <>Demonstrate market awareness and strategic thinking. Discuss trends, competitors, and challenges. Show you can think beyond just the product to the broader ecosystem.</>
                )}
                {(questionData?.category === 'behavioral' || questionData?.category === 'Behavioral') && (
                  <>Use the STAR method (Situation, Task, Action, Result). Be specific with examples and include metrics where possible. Focus on your individual contributions and learnings.</>
                )}
                {(questionData?.category === 'product_sense' || questionData?.category === 'Product Sense') && (
                  <>Structure your answer clearly. Consider user needs, business goals, and technical feasibility. Think about metrics, prioritization, and trade-offs.</>
                )}
                {!['company', 'role', 'industry', 'behavioral', 'Behavioral', 'product_sense', 'Product Sense'].includes(questionData?.category || '') && (
                  <>Take a moment to structure your thoughts before answering. Be specific with examples and metrics. Focus on demonstrating your product thinking and problem-solving approach.</>
                )}
              </p>
            </div>
          </div>

          {/* What to Expect */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Before you begin:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">1</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Allow camera & microphone access</strong> when prompted
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">2</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Structure your answer</strong> - take a moment to organize your thoughts
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">3</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Speak naturally</strong> - the AI will ask follow-up questions
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">4</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Click &quot;Finish&quot; when done</strong> to receive your AI-powered feedback
                </span>
              </li>
            </ul>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">{error}</p>
                <p className="text-red-400/70 text-sm mt-1">Please try again or go back and retry later.</p>
              </div>
            </div>
          )}

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStartPractice}
              disabled={starting}
              className="px-10 py-5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.4)] font-black text-white text-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.4)]"
            >
              {starting ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Starting Session...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <Video className="w-6 h-6" />
                  Start Practice Session
                </span>
              )}
            </button>
            <p className="mt-4 text-gray-500 text-sm">
              Make sure your camera and microphone are enabled
            </p>
          </div>
        </div>
      </div>

      {/* Beta Access Modal */}
      <BetaAccessModal
        isOpen={showBetaModal}
        onClose={() => setShowBetaModal(false)}
        featureName="AI Mock Interview"
      />
    </div>
  );
}
