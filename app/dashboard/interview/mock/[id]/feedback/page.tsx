'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { CheckCircle, Loader2, MessageSquare, Star, Send } from 'lucide-react';

interface MockInterviewFeedbackPageProps {
  params: Promise<{ id: string }>;
}

interface TranscriptMessage {
  sender: 'user' | 'agent' | 'ai';
  message: string;
  sent_at?: string;
}

interface InterviewData {
  id: string;
  status: string;
  transcript: TranscriptMessage[] | null;
  duration_seconds: number | null;
  call_quality_rating: number | null;
  self_performance_rating: number | null;
}

export default function MockInterviewFeedbackPage({ params }: MockInterviewFeedbackPageProps) {
  const router = useRouter();
  const { aiVideoCoach } = useFlags();

  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  // Feedback form state
  const [callQualityRating, setCallQualityRating] = useState<number>(0);
  const [callQualityFeedback, setCallQualityFeedback] = useState('');
  const [selfPerformanceRating, setSelfPerformanceRating] = useState<number>(0);
  const [selfPerformanceNotes, setSelfPerformanceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then((p) => setInterviewId(p.id));
  }, [params]);

  // Fetch interview data
  const fetchInterview = useCallback(async () => {
    if (!interviewId) return;

    try {
      const response = await fetch(`/api/mock-interviews/${interviewId}`);
      if (response.ok) {
        const data = await response.json();
        setInterview(data);

        // Stop polling if we have a transcript or if the call is still in progress
        if (data.transcript && data.transcript.length > 0) {
          setIsPolling(false);
        }

        // Pre-fill ratings if already submitted
        if (data.call_quality_rating) {
          setCallQualityRating(data.call_quality_rating);
          setFeedbackSubmitted(true);
        }
        if (data.self_performance_rating) {
          setSelfPerformanceRating(data.self_performance_rating);
        }
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
    }
  }, [interviewId]);

  // Poll for transcript
  useEffect(() => {
    if (!interviewId || !isPolling) return;

    // Initial fetch
    fetchInterview();

    // Poll every 3 seconds
    const interval = setInterval(() => {
      setPollCount((prev) => prev + 1);
      fetchInterview();
    }, 3000);

    // Stop polling after 60 seconds (20 attempts)
    if (pollCount >= 20) {
      setIsPolling(false);
    }

    return () => clearInterval(interval);
  }, [interviewId, isPolling, pollCount, fetchInterview]);

  // Redirect if feature flag is disabled
  useEffect(() => {
    if (aiVideoCoach === false) {
      router.push('/dashboard/interview');
    }
  }, [aiVideoCoach, router]);

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!interviewId || callQualityRating === 0 || selfPerformanceRating === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/mock-interviews/${interviewId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_quality_rating: callQualityRating,
          call_quality_feedback: callQualityFeedback || null,
          self_performance_rating: selfPerformanceRating,
          self_performance_notes: selfPerformanceNotes || null,
        }),
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Star rating component
  const StarRating = ({
    value,
    onChange,
    disabled = false,
  }: {
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          className={`p-1 transition-colors ${
            disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}
        >
          <Star
            className={`w-8 h-8 ${
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-transparent text-gray-400'
            }`}
          />
        </button>
      ))}
    </div>
  );

  // Loading state
  if (aiVideoCoach === undefined || !interviewId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Interview Complete!
          </h1>
          <p className="text-gray-600 font-medium">
            {interview?.duration_seconds
              ? `Duration: ${formatDuration(interview.duration_seconds)}`
              : 'Great job completing your mock interview.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Left side - Feedback Form */}
          <div className="bg-white rounded-[2rem] border-2 border-gray-200 shadow-[0_8px_0_0_rgba(0,0,0,0.05)] p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Your Feedback
              </h2>
            </div>

            {feedbackSubmitted ? (
              <div className="py-4">
                <div className="flex items-center gap-2 mb-6">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-green-700 font-semibold">Feedback submitted</span>
                </div>

                {/* Display submitted ratings */}
                <div className="space-y-6 mb-8">
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-2">Call Quality</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= callQualityRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-transparent text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-gray-600 font-medium">{callQualityRating}/5</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-2">Self Performance</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= selfPerformanceRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-transparent text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-gray-600 font-medium">{selfPerformanceRating}/5</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/dashboard/interview')}
                  className="w-full px-6 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold hover:opacity-90 transition-opacity"
                >
                  Back to Interview Prep
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Call Quality Rating */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    How was the call quality? <span className="text-red-500">*</span>
                  </label>
                  <StarRating value={callQualityRating} onChange={setCallQualityRating} />
                  <p className="text-xs text-gray-500 mt-2">
                    Rate the audio/video quality and technical experience
                  </p>
                </div>

                {/* Call Quality Feedback */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Any issues or suggestions? (optional)
                  </label>
                  <textarea
                    value={callQualityFeedback}
                    onChange={(e) => setCallQualityFeedback(e.target.value)}
                    placeholder="e.g., Audio was choppy, video froze..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                {/* Self Performance Rating */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    How do you think you performed? <span className="text-red-500">*</span>
                  </label>
                  <StarRating
                    value={selfPerformanceRating}
                    onChange={setSelfPerformanceRating}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Rate your own interview performance
                  </p>
                </div>

                {/* Self Performance Notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Notes about your performance (optional)
                  </label>
                  <textarea
                    value={selfPerformanceNotes}
                    onChange={(e) => setSelfPerformanceNotes(e.target.value)}
                    placeholder="e.g., I struggled with the STAR method, need to practice..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitFeedback}
                  disabled={
                    isSubmitting ||
                    callQualityRating === 0 ||
                    selfPerformanceRating === 0
                  }
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_4px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-600 hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(147,51,234,0.4)] font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_0_0_rgba(147,51,234,0.4)] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right side - Transcript */}
          <div className="bg-white rounded-[2rem] border-2 border-gray-200 shadow-[0_8px_0_0_rgba(0,0,0,0.05)] p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Interview Transcript
              </h2>
              {isPolling && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              )}
            </div>

            {interview?.transcript && interview.transcript.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {interview.transcript.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.sender === 'user'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1 opacity-70">
                        {msg.sender === 'user' ? 'You' : 'AI Interviewer'}
                      </p>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {isPolling ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Processing your interview...
                    </h3>
                    <p className="text-gray-500 text-sm max-w-xs">
                      We&apos;re preparing your transcript. This usually takes a few seconds.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Transcript not available
                    </h3>
                    <p className="text-gray-500 text-sm max-w-xs">
                      The transcript couldn&apos;t be loaded. Please try refreshing the page.
                    </p>
                    <button
                      onClick={() => {
                        setIsPolling(true);
                        setPollCount(0);
                      }}
                      className="mt-4 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-medium hover:bg-purple-200 transition-colors"
                    >
                      Retry
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
