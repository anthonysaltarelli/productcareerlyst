'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { X, AlertTriangle, Video } from 'lucide-react';
import { BetaAccessModal } from '@/app/components/BetaAccessModal';

export default function NewMockInterviewPage() {
  const router = useRouter();
  const { aiVideoCoach } = useFlags();

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBetaAccess, setHasBetaAccess] = useState<boolean | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);

  // Redirect if feature flag is disabled
  useEffect(() => {
    if (aiVideoCoach === false) {
      router.push('/dashboard/interview');
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
    router.push('/dashboard/interview');
  };

  const handleStartInterview = async () => {
    // Check beta access before starting
    if (!hasBetaAccess) {
      setShowBetaModal(true);
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/mock-interviews/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to start mock interview');
      }

      const data = await response.json();

      // Pass LiveKit credentials via query params (base64 encoded for safety)
      const params = new URLSearchParams({
        url: btoa(data.livekitUrl),
        token: btoa(data.livekitToken),
      });

      // Navigate to the actual interview page with credentials
      router.push(`/dashboard/interview/mock/${data.interviewId}?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start mock interview');
      setIsStarting(false);
    }
  };

  // Feature flag or beta access loading state
  if (aiVideoCoach === undefined || hasBetaAccess === null) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 overflow-y-auto">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 pointer-events-none" />

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

      {/* Main content */}
      <div className="relative z-10 flex justify-center px-6 pb-12">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-3">
              Ready for Your Mock Interview?
            </h1>
            <p className="text-lg text-gray-400 max-w-lg mx-auto">
              You&apos;ll practice behavioral interview questions with our AI interviewer for up to 30 minutes.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Before you begin:</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">1</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Allow camera &amp; microphone access</strong> when prompted
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">2</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Find a quiet space</strong> and ensure your audio quality is strong
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">3</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Use the N+STAR+TL method</strong> for behavioral questions
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">4</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Speak naturally</strong> - the AI interviewer will respond conversationally
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">5</span>
                </div>
                <span className="text-gray-300">
                  <strong className="text-white">Click &quot;Finish&quot; when done</strong> to receive your AI-powered feedback and evaluation
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

          <div className="text-center">
            <button
              onClick={handleStartInterview}
              disabled={isStarting}
              className="px-10 py-5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.4)] font-black text-white text-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.4)]"
            >
              {isStarting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Starting Interview...
                </span>
              ) : (
                'Start Interview'
              )}
            </button>
            <p className="mt-4 text-gray-500 text-sm">
              Click &quot;Finish &amp; Get Feedback&quot; at any time to end the session and receive your AI evaluation.
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
