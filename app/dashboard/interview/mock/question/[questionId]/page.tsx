'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { ArrowLeft, Video, Clock, CheckCircle, Loader2 } from 'lucide-react';

interface PMInterviewQuestion {
  id: string;
  category: string;
  question: string;
  guidance: string;
}

export default function QuickQuestionSetupPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const router = useRouter();
  const { aiVideoCoach } = useFlags();

  const [questionId, setQuestionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<PMInterviewQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setQuestionId(p.questionId));
  }, [params]);

  // Feature flag check
  useEffect(() => {
    if (aiVideoCoach === false) {
      router.replace('/dashboard/interview');
    }
  }, [aiVideoCoach, router]);

  // Fetch the question
  useEffect(() => {
    if (!questionId) return;

    const fetchQuestion = async () => {
      try {
        const response = await fetch('/api/interview-questions');
        if (!response.ok) throw new Error('Failed to fetch questions');

        const data = await response.json();
        const found = data.questions?.find((q: PMInterviewQuestion) => q.id === questionId);

        if (!found) {
          setError('Question not found');
          return;
        }

        if (found.category !== 'Behavioral') {
          setError('Quick question practice is only available for Behavioral questions');
          return;
        }

        setQuestion(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load question');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  const handleStartPractice = async () => {
    if (!questionId || starting) return;

    setStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/mock-interviews/quick-question/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-bold mb-4">Error</p>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard/interview')}
            className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
          >
            Back to Interview Prep
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Header */}
      <div className="border-b border-purple-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/interview')}
            className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Quick Question Practice</h1>
            <p className="text-sm text-gray-500">5-minute focused practice session</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Question Card */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-purple-100 overflow-hidden mb-8">
          {/* Question Header */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 px-6 py-4 md:px-8 md:py-5">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wide mb-3">
              {question?.category}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
              {question?.question}
            </h2>
          </div>

          {/* Question Guidance */}
          <div className="px-6 py-5 md:px-8 md:py-6 bg-purple-50/50">
            <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wide mb-2">
              Tips for Answering
            </h3>
            <p className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {question?.guidance}
            </p>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h3 className="font-bold text-gray-800 mb-4">What to Expect</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">5 minute session</p>
                <p className="text-sm text-gray-500">
                  You'll have up to 5 minutes to answer the question
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Video className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Video call with AI coach</p>
                <p className="text-sm text-gray-500">
                  Practice with a realistic AI interviewer who will ask follow-up questions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <CheckCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Get instant feedback</p>
                <p className="text-sm text-gray-500">
                  After the session, receive AI-powered feedback on your answer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 mb-8">
          <h3 className="font-bold text-amber-800 mb-3">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-amber-900">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>
                <strong>Use the N+STAR+TL method:</strong> Start with a nugget summary, then
                Situation, Task, Action, Result, Takeaway, and Learning
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>
                <strong>Be specific:</strong> Use concrete examples, numbers, and metrics when
                possible
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>
                <strong>Own your story:</strong> Focus on what YOU did, not just the team
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>
                <strong>Speak naturally:</strong> This is practice - it's okay to pause and think
              </span>
            </li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStartPractice}
          disabled={starting}
          className="w-full py-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.4)] font-black text-white text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.4)] flex items-center justify-center gap-3"
        >
          {starting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Setting up your session...
            </>
          ) : (
            <>
              <Video className="w-5 h-5" />
              Start Practice Session
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Make sure your camera and microphone are enabled
        </p>
      </div>
    </div>
  );
}
