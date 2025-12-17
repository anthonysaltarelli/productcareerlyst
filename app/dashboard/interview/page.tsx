'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';
import { Video, ChevronRight, HelpCircle, Briefcase, X, Building2, AlertCircle } from 'lucide-react';
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

interface JobWithCompany {
  id: string;
  title: string;
  description: string | null;
  company: {
    id: string;
    name: string;
  } | null;
}

// Verdict badge styling
const verdictBadgeColors: Record<string, { bg: string; text: string }> = {
  'Strong Hire': { bg: 'bg-green-100', text: 'text-green-700' },
  'Hire': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'No Hire': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Strong No Hire': { bg: 'bg-red-100', text: 'text-red-700' },
};

// Category colors for question bank
const categoryColors: Record<string, { bg: string; text: string; hoverBorder: string; hoverBg: string }> = {
  'Behavioral': { bg: 'bg-purple-100', text: 'text-purple-700', hoverBorder: 'hover:border-purple-300', hoverBg: 'hover:bg-purple-50/30' },
  'Product Sense': { bg: 'bg-blue-100', text: 'text-blue-700', hoverBorder: 'hover:border-blue-300', hoverBg: 'hover:bg-blue-50/30' },
  'Technical': { bg: 'bg-orange-100', text: 'text-orange-700', hoverBorder: 'hover:border-orange-300', hoverBg: 'hover:bg-orange-50/30' },
  'Strategy': { bg: 'bg-green-100', text: 'text-green-700', hoverBorder: 'hover:border-green-300', hoverBg: 'hover:bg-green-50/30' },
  'Product Execution': { bg: 'bg-yellow-100', text: 'text-yellow-700', hoverBorder: 'hover:border-yellow-300', hoverBg: 'hover:bg-yellow-50/30' },
  'Analytical': { bg: 'bg-cyan-100', text: 'text-cyan-700', hoverBorder: 'hover:border-cyan-300', hoverBg: 'hover:bg-cyan-50/30' },
  'Leadership': { bg: 'bg-indigo-100', text: 'text-indigo-700', hoverBorder: 'hover:border-indigo-300', hoverBg: 'hover:bg-indigo-50/30' },
  'Culture Fit': { bg: 'bg-pink-100', text: 'text-pink-700', hoverBorder: 'hover:border-pink-300', hoverBg: 'hover:bg-pink-50/30' },
  'Industry Knowledge': { bg: 'bg-teal-100', text: 'text-teal-700', hoverBorder: 'hover:border-teal-300', hoverBg: 'hover:bg-teal-50/30' },
};

function getInterviewLabel(type: string): string {
  return INTERVIEW_TYPES.find((t) => t.value === type)?.label || type;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  return `${mins}m`;
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCategoryColors(category: string) {
  return categoryColors[category] || { bg: 'bg-gray-100', text: 'text-gray-700', hoverBorder: 'hover:border-gray-300', hoverBg: 'hover:bg-gray-50/30' };
}

export default function InterviewPrepPage() {
  const router = useRouter();
  const { aiVideoCoach } = useFlags();

  const [interviews, setInterviews] = useState<PracticeInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<InterviewType>('product_sense');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [questionsLoading, setQuestionsLoading] = useState<boolean>(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Mock interview history state
  const [mockInterviews, setMockInterviews] = useState<MockInterview[]>([]);
  const [mockInterviewsLoading, setMockInterviewsLoading] = useState(false);

  // Expanded question state
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Job selector modal state
  const [showJobSelectorModal, setShowJobSelectorModal] = useState(false);
  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const fetchInterviews = async () => {
    try {
      const response = await fetch('/api/practice-interviews');
      if (!response.ok) throw new Error('Failed to fetch interviews');
      const data = await response.json();
      setInterviews(data.interviews);
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

  // Fetch jobs with descriptions for job-specific practice
  const fetchJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const response = await fetch('/api/jobs/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      // Filter to only jobs with descriptions and sort alphabetically by company name
      const jobsWithDescriptions = (data.applications || [])
        .filter((job: JobWithCompany) => job.description && job.description.trim().length > 0)
        .sort((a: JobWithCompany, b: JobWithCompany) => {
          const companyA = a.company?.name || 'zzz';
          const companyB = b.company?.name || 'zzz';
          return companyA.localeCompare(companyB);
        });
      setJobs(jobsWithDescriptions);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  const handleOpenJobSelectorModal = () => {
    setShowJobSelectorModal(true);
    fetchJobs();
  };

  const handleSelectJob = (jobId: string) => {
    setShowJobSelectorModal(false);
    router.push(`/dashboard/jobs/${jobId}/mock-interview`);
  };

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

  const handleStartMockInterview = () => {
    router.push('/dashboard/interview/mock/new');
  };

  const categories: string[] = [
    'All',
    'Behavioral',
    'Product Sense',
    'Product Execution',
    'Technical',
    'Analytical',
    'Strategy',
    'Leadership',
    'Culture Fit',
    'Industry Knowledge',
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

  // Calculate performance stats
  const completedMocks = mockInterviews.filter(m => m.status === 'completed' || m.ai_evaluation);
  const totalMockSessions = completedMocks.length;
  const allSkillScores = completedMocks.flatMap(m =>
    m.ai_evaluation?.skills?.map((s: { score: number }) => s.score) || []
  );
  const avgScore = allSkillScores.length > 0
    ? (allSkillScores.reduce((sum, score) => sum + score, 0) / allSkillScores.length).toFixed(1)
    : '–';
  const latestMock = completedMocks[0];

  // Combined history: mock interviews + logged interviews
  const combinedHistory = [
    ...mockInterviews.map(m => ({
      id: m.id,
      type: 'mock' as const,
      label: 'Behavioral',
      date: m.created_at,
      duration: m.duration_seconds,
      verdict: m.ai_evaluation?.overallVerdict,
      status: m.status,
    })),
    ...interviews.map(i => ({
      id: i.id,
      type: 'logged' as const,
      label: getInterviewLabel(i.interview_type),
      date: i.completed_at,
      duration: null,
      verdict: null,
      status: 'completed',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <>
        <MobileDashboardHeader title="Interview Prep" />
        <div className="min-h-screen bg-gray-50 p-6 pt-20 md:p-12 md:pt-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
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
        <div className="min-h-screen bg-gray-50 p-6 pt-20 md:p-12 md:pt-12 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-bold mb-4">Error loading practice interviews</p>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchInterviews();
              }}
              className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
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
      <div className="min-h-screen bg-gray-50 p-6 pt-20 md:p-8 lg:p-12 md:pt-8 lg:pt-12 overflow-x-hidden">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
            Interview Practice Hub
          </h1>
          <p className="text-gray-600 font-medium">
            Build confidence with AI-powered mock interviews and targeted practice
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* CARD 1: Start Interview (Primary CTA) - Spans 2 columns on large screens */}
          {aiVideoCoach && (
            <div className="lg:col-span-2 p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-purple-600 to-pink-500 shadow-[0_12px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-white/20">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white">
                  Ready to Practice?
                </h2>
              </div>
              <p className="text-purple-100 font-medium mb-6">
                Start an AI mock interview and receive detailed feedback on your interview skills.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleStartMockInterview}
                  className="px-6 py-4 rounded-[1.5rem] bg-white text-purple-600 font-black text-base shadow-[0_6px_0_0_rgba(255,255,255,0.3)] hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  Start General Mock Interview
                </button>
                <button
                  onClick={handleOpenJobSelectorModal}
                  className="px-6 py-4 rounded-[1.5rem] bg-white/20 text-white font-black text-base border-2 border-white/40 hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-5 h-5" />
                  Start Job-Specific Mock Interview
                </button>
              </div>
            </div>
          )}

          {/* CARD 2: Your Performance */}
          {aiVideoCoach && (
            <div className="p-6 rounded-[2rem] bg-white border-2 border-gray-200 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-black text-gray-800">Your Performance</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 text-center">
                  <p className="text-2xl font-black text-purple-600">{totalMockSessions}</p>
                  <p className="text-xs font-semibold text-gray-600">Mock Sessions</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 text-center">
                  <p className="text-2xl font-black text-green-600">{avgScore}<span className="text-sm font-bold text-gray-400">/4</span></p>
                  <p className="text-xs font-semibold text-gray-600">Avg Score</p>
                </div>
              </div>

              {/* Latest Result */}
              {latestMock ? (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Latest Result</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">Behavioral Interview</span>
                    {latestMock.ai_evaluation?.overallVerdict && (
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${verdictBadgeColors[latestMock.ai_evaluation.overallVerdict]?.bg || 'bg-gray-100'} ${verdictBadgeColors[latestMock.ai_evaluation.overallVerdict]?.text || 'text-gray-700'}`}>
                        {latestMock.ai_evaluation.overallVerdict}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatRelativeDate(latestMock.created_at)}
                    {latestMock.duration_seconds && ` - ${formatDuration(latestMock.duration_seconds)}`}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-center">
                  <p className="text-sm text-gray-500 font-medium">No mock interviews yet</p>
                </div>
              )}
            </div>
          )}

          {/* CARD 3: Question Bank */}
          <div className={`${aiVideoCoach ? 'md:col-span-1 lg:col-span-2' : 'lg:col-span-3'} p-6 rounded-[2rem] bg-white border-2 border-gray-200 shadow-sm`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-gray-800">Question Bank</h3>
                <p className="text-sm text-gray-500 font-medium">Browse and practice PM interview questions</p>
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-0 font-medium text-gray-800 placeholder-gray-400 text-sm w-40"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((category) => {
                const colors = getCategoryColors(category);
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : category === 'All'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : `${colors.bg} ${colors.text} hover:opacity-80`
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Questions Preview */}
            <div className="space-y-2 max-h-[450px] overflow-y-auto">
              {questionsLoading ? (
                <div className="p-4 text-center">
                  <p className="text-gray-500 font-medium">Loading questions...</p>
                </div>
              ) : questionsError ? (
                <div className="p-4 text-center">
                  <p className="text-red-600 font-medium">{questionsError}</p>
                  <button
                    onClick={fetchQuestions}
                    className="mt-2 text-purple-600 font-semibold text-sm hover:text-purple-700"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-gray-500 font-medium">
                    {searchQuery ? 'No questions match your search.' : 'No questions found for this category.'}
                  </p>
                </div>
              ) : (
                filteredQuestions.map((question) => {
                  const colors = getCategoryColors(question.category);
                  const isExpanded = expandedQuestionId === question.id;
                  return (
                    <div
                      key={question.id}
                      className={`p-3 rounded-xl border border-gray-200 ${colors.hoverBorder} ${colors.hoverBg} transition-colors cursor-pointer`}
                      onClick={() => setExpandedQuestionId(isExpanded ? null : question.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm leading-relaxed">
                            <span className={`inline-flex px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} text-xs font-bold mr-2 align-middle`}>
                              {question.category}
                            </span>
                            {question.question}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {aiVideoCoach && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/interview/mock/question/${question.id}`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                            >
                              Practice
                            </button>
                          )}
                          <ChevronRight className={`w-4 h-4 text-gray-400 mt-0.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded guidance section */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tips for Answering</p>
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{question.guidance}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CARD 4: Mock Interview History (Consolidated with Log feature) */}
          {aiVideoCoach && (
            <div className="p-6 rounded-[2rem] bg-white border-2 border-gray-200 shadow-sm self-start">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-800">Mock History</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenModal}
                    className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 font-semibold text-xs hover:bg-blue-200 transition-colors"
                  >
                    + Log
                  </button>
                  <div className="relative group">
                    <button className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-3 py-2 bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      Log interviews done with friends, mentors, or in real interviews to track all your practice in one place.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {mockInterviewsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  </div>
                ) : combinedHistory.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-500 font-medium text-sm">No interview history yet</p>
                  </div>
                ) : (
                  combinedHistory.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        if (item.type === 'mock') {
                          router.push(`/dashboard/interview/mock/${item.id}/feedback`);
                        }
                      }}
                      className={`w-full p-3 rounded-xl bg-gray-50 border border-gray-200 ${item.type === 'logged' ? 'border-dashed' : ''} flex items-center justify-between gap-3 hover:border-purple-300 hover:bg-purple-50/30 transition-colors text-left`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          item.type === 'logged'
                            ? 'bg-gray-100'
                            : item.verdict === 'Strong Hire'
                              ? 'bg-green-100'
                              : item.verdict === 'Hire'
                                ? 'bg-blue-100'
                                : item.verdict === 'No Hire'
                                  ? 'bg-orange-100'
                                  : 'bg-purple-100'
                        }`}>
                          {item.type === 'logged' ? (
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          ) : (
                            <Video className={`w-4 h-4 ${
                              item.verdict === 'Strong Hire'
                                ? 'text-green-600'
                                : item.verdict === 'Hire'
                                  ? 'text-blue-600'
                                  : item.verdict === 'No Hire'
                                    ? 'text-orange-600'
                                    : 'text-purple-600'
                            }`} />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {item.label}
                            {item.type === 'logged' && <span className="text-gray-400 font-normal"> (logged)</span>}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeDate(item.date)}
                            {item.duration && ` - ${formatDuration(item.duration)}`}
                          </p>
                        </div>
                      </div>
                      {item.type === 'mock' && item.verdict ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${verdictBadgeColors[item.verdict]?.bg || 'bg-gray-100'} ${verdictBadgeColors[item.verdict]?.text || 'text-gray-700'}`}>
                          {item.verdict}
                        </span>
                      ) : item.type === 'logged' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Manual</span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>

            </div>
          )}
        </div>

        {/* Mobile Sticky CTA */}
        {aiVideoCoach && (
          <>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden z-40">
              <button
                onClick={handleStartMockInterview}
                className="w-full py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-600 to-pink-500 text-white font-black text-lg shadow-lg shadow-purple-500/30"
              >
                Start AI Mock Interview
              </button>
            </div>
            {/* Spacer for mobile sticky CTA */}
            <div className="h-24 md:hidden"></div>
          </>
        )}

        {/* Log Interview Modal */}
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-0 font-medium text-gray-800"
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-0 font-medium text-gray-800"
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
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-600 font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Log Interview'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job Selector Modal */}
        {showJobSelectorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 md:p-8 pb-4 flex-shrink-0 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-800">Select a Job</h2>
                  <p className="text-gray-500 text-sm font-medium mt-1">
                    Choose a job to practice company-specific questions
                  </p>
                </div>
                <button
                  onClick={() => setShowJobSelectorModal(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-6">
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : jobsError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 font-medium">{jobsError}</p>
                    <button
                      onClick={fetchJobs}
                      className="mt-3 text-purple-600 font-semibold text-sm hover:text-purple-700"
                    >
                      Try again
                    </button>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">No jobs with descriptions yet</p>
                    <p className="text-gray-500 text-sm mb-4">
                      Add a job description to practice company-specific questions.
                    </p>
                    <Link
                      href="/dashboard/jobs"
                      onClick={() => setShowJobSelectorModal(false)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 font-semibold text-sm hover:bg-purple-200 transition-colors"
                    >
                      Go to Jobs
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {jobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => handleSelectJob(job.id)}
                        className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left flex items-center gap-3"
                      >
                        <div className="p-2 rounded-lg bg-purple-100 flex-shrink-0">
                          <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 truncate">{job.title}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {job.company?.name || 'Unknown Company'}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
