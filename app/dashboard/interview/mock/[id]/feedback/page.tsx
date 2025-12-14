'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
  CheckCircle,
  Loader2,
  MessageSquare,
  Star,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Quote,
  Target,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import type { AIBehavioralEvaluation, SkillEvaluation } from '@/lib/types/interview-evaluation';

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
  ai_evaluation: AIBehavioralEvaluation | null;
}

// Verdict color mapping
const verdictColors: Record<string, { bg: string; text: string; border: string }> = {
  'Strong Hire': {
    bg: 'from-green-500 to-emerald-600',
    text: 'text-white',
    border: 'border-green-600',
  },
  Hire: {
    bg: 'from-blue-500 to-cyan-600',
    text: 'text-white',
    border: 'border-blue-600',
  },
  'No Hire': {
    bg: 'from-orange-500 to-amber-600',
    text: 'text-white',
    border: 'border-orange-600',
  },
  'Strong No Hire': {
    bg: 'from-red-500 to-rose-600',
    text: 'text-white',
    border: 'border-red-600',
  },
};

// Score color mapping (1-4 scale)
const getScoreColor = (score: number): string => {
  if (score >= 3.5) return 'from-green-400 to-emerald-500';
  if (score >= 2.5) return 'from-blue-400 to-cyan-500';
  if (score >= 1.5) return 'from-orange-400 to-amber-500';
  return 'from-red-400 to-rose-500';
};

const getScoreLabel = (score: number): string => {
  if (score >= 3.5) return 'Very Strong';
  if (score >= 2.5) return 'Strong';
  if (score >= 1.5) return 'Weak';
  return 'Very Weak';
};

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

  // AI Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [expandedSkills, setExpandedSkills] = useState<Set<number>>(new Set());

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

        // Stop polling if we have a transcript
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

  // Request AI evaluation
  const handleRequestEvaluation = async () => {
    if (!interviewId || !interview?.transcript?.length) return;

    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const response = await fetch(`/api/mock-interviews/${interviewId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInterview((prev) => (prev ? { ...prev, ai_evaluation: data.evaluation } : prev));
      } else {
        setEvaluationError(data.error || 'Failed to generate evaluation');
      }
    } catch (error) {
      console.error('Error requesting evaluation:', error);
      setEvaluationError('An unexpected error occurred');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Toggle skill expansion
  const toggleSkillExpanded = (index: number) => {
    setExpandedSkills((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
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

  // Skill Card component
  const SkillCard = ({
    skill,
    index,
    isExpanded,
    onToggle,
  }: {
    skill: SkillEvaluation;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
  }) => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-700 truncate">{skill.skillName}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor(skill.score)}`}
                style={{ width: `${(skill.score / 4) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-900 w-8">{skill.score}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${getScoreColor(skill.score)} text-white`}
              >
                {getScoreLabel(skill.score)}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{skill.explanation}</p>
          </div>
          {skill.supportingQuotes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Quote className="w-3 h-3" />
                Supporting Quotes
              </div>
              {skill.supportingQuotes.map((quote, i) => (
                <blockquote
                  key={i}
                  className="pl-3 border-l-2 border-purple-300 text-sm text-gray-600 italic"
                >
                  &ldquo;{quote}&rdquo;
                </blockquote>
              ))}
            </div>
          )}
        </div>
      )}
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

  const hasTranscript = interview?.transcript && interview.transcript.length > 0;
  const hasEvaluation = interview?.ai_evaluation;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Breadcrumb */}
        <button
          onClick={() => router.push('/dashboard/interview')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 font-medium transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Interview Prep</span>
        </button>

        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Interview Complete!
          </h1>
          <p className="text-gray-600 font-medium">
            {interview?.duration_seconds
              ? `Duration: ${formatDuration(interview.duration_seconds)}`
              : 'Great job completing your mock interview.'}
          </p>
        </div>

        {/* AI Evaluation Section - Full Width at Top */}
        <div className="bg-white rounded-[2rem] border-2 border-gray-200 shadow-[0_8px_0_0_rgba(0,0,0,0.05)] p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">AI Evaluation</h2>
          </div>

          {hasEvaluation ? (
            <div className="space-y-6">
              {/* Overall Verdict - Full Width with Average Score inline */}
              <div
                className={`p-6 rounded-2xl bg-gradient-to-br ${verdictColors[interview.ai_evaluation!.overallVerdict]?.bg || 'from-gray-500 to-gray-600'} ${verdictColors[interview.ai_evaluation!.overallVerdict]?.border || 'border-gray-600'} border-2`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Verdict Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-white/80" />
                      <span className="text-white/80 font-semibold text-xs uppercase tracking-wider">
                        Overall Verdict
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
                      {interview.ai_evaluation!.overallVerdict}
                    </h3>
                    <p className="text-white/90 text-sm leading-relaxed">
                      {interview.ai_evaluation!.overallExplanation}
                    </p>
                  </div>

                  {/* Average Score - Full height sidebar */}
                  <div className="lg:w-48 flex-shrink-0 p-4 bg-white/15 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
                    <div className="text-white/70 font-semibold text-xs uppercase tracking-wider mb-2">
                      Avg Score
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-black text-white">
                        {(
                          interview.ai_evaluation!.skills.reduce((acc, s) => acc + s.score, 0) /
                          interview.ai_evaluation!.skills.length
                        ).toFixed(1)}
                      </span>
                      <span className="text-lg font-medium text-white/60">/4</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-white"
                        style={{
                          width: `${(interview.ai_evaluation!.skills.reduce((acc, s) => acc + s.score, 0) / interview.ai_evaluation!.skills.length / 4) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Breakdown - 2 columns */}
              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Skills Breakdown ({interview.ai_evaluation!.skills.length} competencies)
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {interview.ai_evaluation!.skills.map((skill, index) => (
                    <SkillCard
                      key={index}
                      skill={skill}
                      index={index}
                      isExpanded={expandedSkills.has(index)}
                      onToggle={() => toggleSkillExpanded(index)}
                    />
                  ))}
                </div>
              </div>

              {/* Recommended Improvements */}
              <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                  <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wider">
                    Recommended Improvements
                  </h4>
                </div>
                <ul className="grid md:grid-cols-2 gap-3">
                  {interview.ai_evaluation!.recommendedImprovements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700 leading-relaxed">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : hasTranscript ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {isEvaluating ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-purple-500 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Analyzing your interview...
                  </h3>
                  <p className="text-gray-500 text-sm max-w-md mb-4">
                    Our AI is evaluating your performance across 12 key PM competencies using the
                    N+STAR+TL framework. This usually takes 30-60 seconds.
                  </p>
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </>
              ) : evaluationError ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Evaluation Failed</h3>
                  <p className="text-gray-500 text-sm max-w-xs mb-4">{evaluationError}</p>
                  <button
                    onClick={handleRequestEvaluation}
                    className="px-6 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Get AI-Powered Feedback</h3>
                  <p className="text-gray-500 text-sm max-w-md mb-6">
                    Let our AI analyze your interview performance and provide detailed feedback on
                    12 PM competencies using the N+STAR+TL framework.
                  </p>
                  <button
                    onClick={handleRequestEvaluation}
                    className="px-6 py-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_4px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-600 hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(147,51,234,0.4)] font-bold text-white transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate AI Evaluation
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {isPolling ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Waiting for transcript...</h3>
                  <p className="text-gray-500 text-sm max-w-xs">
                    AI evaluation will be available once your interview transcript is ready.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Transcript not available</h3>
                  <p className="text-gray-500 text-sm max-w-xs">
                    AI evaluation requires a transcript. Please try refreshing the page.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom Row: Feedback Form + Transcript */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Left side - Feedback Form */}
          <div className="bg-white rounded-[2rem] border-2 border-gray-200 shadow-[0_8px_0_0_rgba(0,0,0,0.05)] p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Your Feedback</h2>
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
                      <span className="ml-2 text-gray-600 font-medium">
                        {selfPerformanceRating}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
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
                    rows={2}
                  />
                </div>

                {/* Self Performance Rating */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    How do you think you performed? <span className="text-red-500">*</span>
                  </label>
                  <StarRating value={selfPerformanceRating} onChange={setSelfPerformanceRating} />
                  <p className="text-xs text-gray-500 mt-2">Rate your own interview performance</p>
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
                    rows={2}
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitFeedback}
                  disabled={
                    isSubmitting || callQualityRating === 0 || selfPerformanceRating === 0
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
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Transcript</h2>
              </div>
              {isPolling && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              )}
            </div>

            {hasTranscript ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {interview.transcript!.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
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
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Transcript not available</h3>
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
