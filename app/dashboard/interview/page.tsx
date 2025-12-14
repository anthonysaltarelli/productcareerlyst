'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';
import { Video, Clock, Star, ChevronRight, MessageSquare, Award } from 'lucide-react';
import type { AIBehavioralEvaluation } from '@/lib/types/interview-evaluation';

// Interview types matching the job application center
const INTERVIEW_TYPES = [
  { value: 'recruiter_screen', label: 'Recruiter Screen', emoji: '📞' },
  { value: 'hiring_manager_screen', label: 'Hiring Manager Screen', emoji: '👔' },
  { value: 'product_sense', label: 'Product Sense', emoji: '💡' },
  { value: 'product_analytics_execution', label: 'Product Analytics / Execution', emoji: '📊' },
  { value: 'system_design', label: 'System Design', emoji: '🏗️' },
  { value: 'technical', label: 'Technical', emoji: '💻' },
  { value: 'product_strategy', label: 'Product Strategy', emoji: '🎯' },
  { value: 'estimation', label: 'Estimation', emoji: '🔢' },
  { value: 'executive', label: 'Executive', emoji: '👑' },
  { value: 'cross_functional', label: 'Cross Functional', emoji: '🤝' },
] as const;

type InterviewType = (typeof INTERVIEW_TYPES)[number]['value'];

interface PracticeInterview {
  id: string;
  interview_type: InterviewType;
  completed_at: string;
  created_at: string;
}

interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  guidance: string;
}

interface MockInterview {
  id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  call_quality_rating: number | null;
  self_performance_rating: number | null;
  ai_evaluation: AIBehavioralEvaluation | null;
  created_at: string;
}

// Verdict badge styling
const verdictBadgeColors: Record<string, { bg: string; text: string }> = {
  'Strong Hire': { bg: 'bg-green-100', text: 'text-green-700' },
  'Hire': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'No Hire': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Strong No Hire': { bg: 'bg-red-100', text: 'text-red-700' },
};

function getInterviewLabel(type: string): string {
  return INTERVIEW_TYPES.find((t) => t.value === type)?.label || type;
}

function getInterviewEmoji(type: string): string {
  return INTERVIEW_TYPES.find((t) => t.value === type)?.emoji || '📝';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return formatDate(dateString);
}


export default function InterviewPrepPage() {
  const router = useRouter();
  const { aiVideoCoach } = useFlags();

  const [interviews, setInterviews] = useState<PracticeInterview[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<InterviewType>('product_sense');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState<boolean>(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Mock interview history state
  const [mockInterviews, setMockInterviews] = useState<MockInterview[]>([]);
  const [mockInterviewsLoading, setMockInterviewsLoading] = useState(false);
  const [showAllMockInterviews, setShowAllMockInterviews] = useState(false);

  const fetchInterviews = async () => {
    try {
      const response = await fetch('/api/practice-interviews');
      if (!response.ok) throw new Error('Failed to fetch interviews');
      const data = await response.json();
      setInterviews(data.interviews);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchQuestions = async () => {
    try {
      setQuestionsLoading(true);
      const response = await fetch('/api/interview-questions');
      if (!response.ok) {
        throw new Error('Failed to fetch interview questions');
      }
      const data = (await response.json()) as { questions: InterviewQuestion[] };
      setQuestions(data.questions);
    } catch (err) {
      setQuestionsError(
        err instanceof Error ? err.message : 'An error occurred while loading questions',
      );
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Fetch mock interview history
  const fetchMockInterviews = async () => {
    if (!aiVideoCoach) return;

    setMockInterviewsLoading(true);
    try {
      const response = await fetch('/api/mock-interviews');
      if (response.ok) {
        const data = await response.json();
        setMockInterviews(data.interviews || []);
      }
    } catch (err) {
      console.error('Error fetching mock interviews:', err);
    } finally {
      setMockInterviewsLoading(false);
    }
  };

  useEffect(() => {
    if (aiVideoCoach) {
      fetchMockInterviews();
    }
  }, [aiVideoCoach]);

  const handleOpenModal = () => {
    setSelectedType('product_sense');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/practice-interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_type: selectedType,
          completed_at: new Date(selectedDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to save interview');
      }

      await fetchInterviews();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this practice interview?')) return;

    try {
      const response = await fetch(`/api/practice-interviews?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete interview');

      await fetchInterviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const totalInterviews = interviews.length;

  const categories: string[] = [
    'All',
    'Behavioral',
    'Product Sense',
    'Product Execution',
    'Technical Questions',
    'Analytical Questions',
    'Strategy Questions',
    'Leadership Questions',
    'Culture Fit Questions',
    'Industry Knowledge Questions',
  ];

  const filteredQuestions = questions.filter((question) => {
    const matchesCategory =
      selectedCategory === 'All' || question.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.guidance.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggleQuestion = (id: string) => {
    if (expandedQuestionId === id) {
      setExpandedQuestionId(null);
      return;
    }
    setExpandedQuestionId(id);
  };

  const handleStartMockInterview = () => {
    // Just navigate to the full-screen page - API call happens there when user clicks "Start Interview"
    router.push('/dashboard/interview/mock/new');
  };


  if (loading) {
    return (
      <>
        <MobileDashboardHeader title="Interview Prep" />
        <div className="min-h-screen p-6 pt-20 md:p-12 md:pt-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold">Loading practice interviews...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <MobileDashboardHeader title="Interview Prep" />
        <div className="min-h-screen p-6 pt-20 md:p-12 md:pt-12 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-bold mb-4">Error loading practice interviews</p>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchInterviews();
              }}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileDashboardHeader title="Interview Prep" />
      <div className="min-h-screen p-6 pt-20 md:p-12 md:pt-12">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_12px_0_0_rgba(37,99,235,0.3)] md:shadow-[0_20px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
            <div>
              <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-br from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-2">
                🎯 Interview Prep
              </h1>
              <p className="text-base md:text-xl text-gray-700 font-semibold">
                Track your practice interviews and build confidence
              </p>
            </div>
          </div>
        </div>

        {/* AI Video Mock Interview Section - Feature Flagged */}
        {aiVideoCoach && (
          <div className="mb-6 md:mb-8">
            <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-purple-100 to-pink-100 shadow-[0_12px_0_0_rgba(147,51,234,0.25)] md:shadow-[0_16px_0_0_rgba(147,51,234,0.25)] border-2 border-purple-300">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent">
                      AI Video Mock Behavioral Interview
                    </h2>
                  </div>
                  <p className="text-gray-700 font-medium mb-4 md:mb-0 max-w-xl">
                    Practice behavioral interviews with our AI interviewer for 30 minutes. Afterwards, get a detailed interviewer scorecard and actionable feedback on how to improve your interviewing skills.
                  </p>
                  <div className="hidden md:flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 rounded-full bg-purple-200/60 text-purple-700 text-sm font-semibold">
                      30 min session
                    </span>
                    <span className="px-3 py-1 rounded-full bg-pink-200/60 text-pink-700 text-sm font-semibold">
                      Behavioral questions
                    </span>
                    <span className="px-3 py-1 rounded-full bg-purple-200/60 text-purple-700 text-sm font-semibold">
                      N+STAR+TL method practice
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={handleStartMockInterview}
                    className="w-full md:w-auto px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.4)] font-black text-white transition-all duration-200"
                  >
                    Start Mock Interview
                  </button>
                </div>
              </div>

              {/* Past Mock Interviews */}
              {mockInterviews.length > 0 && (
                <div className="mt-6 pt-6 border-t border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      Past Mock Interviews
                    </h3>
                    <span className="text-sm text-gray-500 font-medium">
                      {mockInterviews.length} session{mockInterviews.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {mockInterviewsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      </div>
                    ) : (
                      (showAllMockInterviews ? mockInterviews : mockInterviews.slice(0, 5)).map((interview) => (
                        <button
                          key={interview.id}
                          onClick={() => router.push(`/dashboard/interview/mock/${interview.id}/feedback`)}
                          className="w-full p-4 rounded-xl bg-white border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-between gap-4 text-left"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg ${
                              interview.status === 'completed'
                                ? 'bg-green-100'
                                : interview.status === 'in_progress'
                                  ? 'bg-yellow-100'
                                  : 'bg-gray-100'
                            }`}>
                              <Video className={`w-4 h-4 ${
                                interview.status === 'completed'
                                  ? 'text-green-600'
                                  : interview.status === 'in_progress'
                                    ? 'text-yellow-600'
                                    : 'text-gray-500'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 truncate">
                                Behavioral Interview
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{formatRelativeDate(interview.created_at)}</span>
                                {interview.duration_seconds && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(interview.duration_seconds)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {interview.ai_evaluation?.overallVerdict && (
                              <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${verdictBadgeColors[interview.ai_evaluation.overallVerdict]?.bg || 'bg-gray-100'} ${verdictBadgeColors[interview.ai_evaluation.overallVerdict]?.text || 'text-gray-700'}`}>
                                {interview.ai_evaluation.overallVerdict}
                              </div>
                            )}
                            {!interview.ai_evaluation && interview.self_performance_rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-medium text-gray-700">
                                  {interview.self_performance_rating}/5
                                </span>
                              </div>
                            )}
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {mockInterviews.length > 5 && (
                    <button
                      onClick={() => setShowAllMockInterviews(!showAllMockInterviews)}
                      className="w-full mt-3 py-2 text-purple-600 font-medium text-sm hover:text-purple-700 transition-colors"
                    >
                      {showAllMockInterviews
                        ? 'Show less ↑'
                        : `View all ${mockInterviews.length} interviews →`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Practice & Questions layout - 60/40 split */}
        <div className="md:grid md:grid-cols-10 md:gap-8">
          {/* PM Questions & Answers - First column (60%) */}
          <div className="md:col-span-6 mb-8 md:mb-0">
            <div className="rounded-[2rem] bg-white border-2 border-gray-200 shadow-sm p-5 md:p-6 flex flex-col">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-1">
                  PM Question Guidance
                </h2>
                <p className="text-gray-600 font-medium text-sm md:text-base">
                  View PM questions by interview type and get recommendations for crafting standout answers.
                </p>
              </div>

              {/* Search */}
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-0 font-medium text-gray-800 placeholder-gray-400"
                />
              </div>

              {/* Category Filter - Dropdown */}
              <div className="mt-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-0 font-medium text-gray-800"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Questions List */}
              <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3 min-h-[300px] max-h-[600px]">
                {questionsLoading ? (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                    <p className="text-gray-700 font-semibold text-sm md:text-base">
                      Loading questions...
                    </p>
                  </div>
                ) : questionsError ? (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-red-700 font-bold mb-1 text-sm md:text-base">
                      Error loading questions
                    </p>
                    <p className="text-red-700 text-xs md:text-sm mb-2">{questionsError}</p>
                    <button
                      type="button"
                      onClick={fetchQuestions}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs md:text-sm font-bold hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                    <p className="text-gray-700 font-semibold text-sm md:text-base">
                      {searchQuery
                        ? 'No questions match your search.'
                        : 'No questions found for this category yet.'}
                    </p>
                  </div>
                ) : (
                  filteredQuestions.map((question) => {
                    const isExpanded = expandedQuestionId === question.id;
                    return (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleQuestion(question.id)}
                          className="w-full flex items-start justify-between gap-3 px-3 py-3 md:px-4 md:py-3 text-left"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
                              {question.category}
                            </p>
                            <p className="text-sm md:text-base font-semibold text-gray-900">
                              {question.question}
                            </p>
                          </div>
                          <span
                            className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-gray-600 flex-shrink-0"
                            aria-hidden="true"
                          >
                            <svg
                              className={`h-3 w-3 md:h-4 md:w-4 transform transition-transform ${
                                isExpanded ? 'rotate-180' : 'rotate-0'
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </span>
                        </button>
                        <div
                          className={`border-t border-gray-100 bg-gray-50 px-3 md:px-4 overflow-hidden transition-all duration-200 ease-out ${
                            isExpanded ? 'max-h-96 py-3 opacity-100' : 'max-h-0 py-0 opacity-0'
                          }`}
                        >
                          <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                            {question.guidance}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Practice History - Second column (40%) */}
          <div className="md:col-span-4">
            {totalInterviews === 0 ? (
              <div className="p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 text-center">
                <span className="text-6xl mb-6 block">🎤</span>
                <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-3">
                  No practice interviews yet
                </h2>
                <p className="text-gray-600 font-medium mb-6 max-w-md mx-auto text-base md:text-lg">
                  Start logging your mock interviews to track your progress and identify areas to
                  improve. Practice makes perfect!
                </p>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_6px_0_0_rgba(37,99,235,0.4)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.4)] font-black text-white transition-all duration-200"
                >
                  Log Your First Practice Interview
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800">Practice History</h2>
                  <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 rounded-[1rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_4px_0_0_rgba(37,99,235,0.4)] border-2 border-blue-600 hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(37,99,235,0.4)] font-bold text-white text-sm transition-all duration-200 whitespace-nowrap"
                  >
                    + Log Interview
                  </button>
                </div>
                
                {/* Practice Summary Stats */}
                {totalInterviews > 0 && (
                  <div className="p-4 rounded-[1.5rem] bg-white border-2 border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Practice Summary</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 text-center">
                        <p className="text-xl font-black text-blue-600">{totalInterviews}</p>
                        <p className="text-xs font-semibold text-gray-600">Total Sessions</p>
                      </div>
                      {Object.entries(stats)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([type, count]) => (
                          <div
                            key={type}
                            className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-center"
                          >
                            <p className="text-xl font-black text-gray-700">{count}</p>
                            <p className="text-xs font-semibold text-gray-600 truncate">
                              {getInterviewEmoji(type)} {getInterviewLabel(type)}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="p-4 md:p-6 rounded-[1.5rem] bg-white border-2 border-gray-200 shadow-sm hover:border-blue-300 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-3xl flex-shrink-0">
                          {getInterviewEmoji(interview.interview_type)}
                        </span>
                        <div>
                          <p className="font-bold text-gray-800">
                            {getInterviewLabel(interview.interview_type)}
                          </p>
                          <p className="text-sm md:text-base text-gray-500">
                            Completed {formatDate(interview.completed_at)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(interview.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 md:p-8 pb-4 flex-shrink-0">
                <h2 className="text-2xl font-black text-gray-800">Log Practice Interview</h2>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 md:px-8">
                <form onSubmit={handleSubmit} id="interview-form" className="space-y-5 pb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Interview Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as InterviewType)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-0 font-medium text-gray-800"
                    >
                      {INTERVIEW_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.emoji} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Date Completed
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-0 font-medium text-gray-800"
                    />
                  </div>
                </form>
              </div>
              
              {/* Fixed Footer with Buttons */}
              <div className="p-6 md:p-8 pt-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="interview-form"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-blue-600 font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Log Interview'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
