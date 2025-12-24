import { createClient } from '@/lib/supabase/server';
import { getUserSubscription } from '@/lib/utils/subscription';
import type { TimeRange } from '@/app/components/dashboard/TimeRangeSelector';

// Extended metrics types with time-based data
export interface LearningMetrics {
  lessonsCompleted: number;
  previousLessonsCompleted: number | null;
  coursesCompleted: number;
  previousCoursesCompleted: number | null;
  totalWatchTimeSeconds: number;
  previousWatchTimeSeconds: number | null;
  learningStreak: number; // consecutive days
  courseCompletionRate: number; // percentage
  dailyLessons: number[]; // for sparkline
}

export interface JobSearchMetrics {
  totalApplications: number;
  previousTotalApplications: number | null;
  activeApplications: number;
  applicationsByStatus: {
    wishlist: number;
    applied: number;
    interviewing: number;
    offer: number;
    rejected: number;
    withdrawn: number;
    accepted: number;
  };
  interviewRate: number; // percentage
  offerRate: number; // percentage
  contactsCount: number;
  previousContactsCount: number | null;
  companiesResearched: number;
  dailyApplications: number[]; // for sparkline
}

export interface InterviewMetrics {
  mockInterviewsCompleted: number;
  previousMockInterviews: number | null;
  averageScore: number | null;
  previousAverageScore: number | null;
  practiceHours: number;
  typesPracticed: number;
  scoreHistory: number[]; // for sparkline
}

export interface ResumeMetrics {
  versionsCount: number;
  previousVersionsCount: number | null;
  highestScore: number | null;
  previousHighestScore: number | null;
  scoreImprovement: number | null; // difference from first to latest
  jobSpecificResumes: number;
}

export interface PortfolioMetrics {
  isPublished: boolean;
  totalPages: number;
  publishedPages: number;
  draftPages: number;
  previousTotalPages: number | null;
}

export interface DashboardMetrics {
  timeRange: TimeRange;
  learning: LearningMetrics;
  jobSearch: JobSearchMetrics;
  interview: InterviewMetrics;
  resume: ResumeMetrics;
  portfolio: PortfolioMetrics;
  subscription: {
    plan: 'learn' | 'accelerate' | null;
    status: string | null;
    isActive: boolean;
  };
}

// Helper to get date range boundaries
function getDateRangeBounds(range: TimeRange): {
  start: Date | null;
  end: Date;
  prevStart: Date | null;
  prevEnd: Date | null;
  days: number;
} {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (range === 'all') {
    return { start: null, end, prevStart: null, prevEnd: null, days: 0 };
  }

  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[range] || 30;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);

  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);

  const prevStart = new Date(prevEnd);
  prevStart.setHours(0, 0, 0, 0);
  prevStart.setDate(prevStart.getDate() - days + 1);

  return { start, end, prevStart, prevEnd, days };
}

// Generate daily breakdown for sparkline
function generateDailyBreakdown(
  items: { date: Date }[],
  days: number,
  endDate: Date
): number[] {
  if (days === 0) return []; // All time doesn't show daily

  const dailyCounts = new Array(days).fill(0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  items.forEach(item => {
    const itemDate = new Date(item.date);
    const dayIndex = Math.floor((itemDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    if (dayIndex >= 0 && dayIndex < days) {
      dailyCounts[dayIndex]++;
    }
  });

  return dailyCounts;
}

// Calculate learning streak (consecutive days with completions)
function calculateLearningStreak(completionDates: Date[]): number {
  if (completionDates.length === 0) return 0;

  // Get unique days as timestamps (midnight of each day)
  const uniqueDayTimestamps = new Set(
    completionDates.map(d => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  const sortedDays = Array.from(uniqueDayTimestamps)
    .map(ts => new Date(ts))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDays.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    const dayDate = new Date(sortedDays[i]);
    dayDate.setHours(0, 0, 0, 0);

    if (dayDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0 && dayDate.getTime() === expectedDate.getTime() - 86400000) {
      // Allow streak to continue if today has no activity but yesterday did
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export const getDashboardMetrics = async (
  userId: string,
  timeRange: TimeRange
): Promise<DashboardMetrics | null> => {
  try {
    const supabase = await createClient();
    const { start, end, prevStart, prevEnd, days } = getDateRangeBounds(timeRange);

    // Build date filter for queries
    const dateFilter = start ? `.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())` : '';

    // Fetch all data in parallel
    const [
      learningData,
      jobData,
      interviewData,
      resumeData,
      portfolioData,
      subscription,
    ] = await Promise.all([
      // Learning data
      fetchLearningData(supabase, userId, start, end, prevStart, prevEnd, days),
      // Job search data
      fetchJobSearchData(supabase, userId, start, end, prevStart, prevEnd, days),
      // Interview data
      fetchInterviewData(supabase, userId, start, end, prevStart, prevEnd),
      // Resume data
      fetchResumeData(supabase, userId, start, end, prevStart, prevEnd),
      // Portfolio data
      fetchPortfolioData(supabase, userId, start, end, prevStart, prevEnd),
      // Subscription
      getUserSubscription(userId),
    ]);

    return {
      timeRange,
      learning: learningData,
      jobSearch: jobData,
      interview: interviewData,
      resume: resumeData,
      portfolio: portfolioData,
      subscription: {
        plan: subscription?.plan || null,
        status: subscription?.status || null,
        isActive: subscription?.status === 'active' || subscription?.status === 'trialing',
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return null;
  }
};

// Fetch learning metrics
async function fetchLearningData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  start: Date | null,
  end: Date,
  prevStart: Date | null,
  prevEnd: Date | null,
  days: number
): Promise<LearningMetrics> {
  // Get all progress data
  let query = supabase
    .from('user_progress')
    .select('lesson_id, completed, completed_at, watch_duration_seconds')
    .eq('user_id', userId)
    .eq('completed', true);

  const { data: allProgress } = await query;
  const progress = allProgress || [];

  // Get all lessons and courses for completion calculations
  const [lessonsResult, coursesResult] = await Promise.all([
    supabase.from('lessons').select('id, course_id'),
    supabase.from('courses').select('id'),
  ]);

  const allLessons = lessonsResult.data || [];
  const completedLessonIds = new Set(progress.map(p => p.lesson_id));

  // Filter by date range
  const currentProgress = start
    ? progress.filter(p => {
        const date = new Date(p.completed_at);
        return date >= start && date <= end;
      })
    : progress;

  const previousProgress = prevStart && prevEnd
    ? progress.filter(p => {
        const date = new Date(p.completed_at);
        return date >= prevStart && date <= prevEnd;
      })
    : null;

  // Calculate courses completed
  const lessonsByCourse = new Map<string, Set<string>>();
  allLessons.forEach(lesson => {
    if (!lessonsByCourse.has(lesson.course_id)) {
      lessonsByCourse.set(lesson.course_id, new Set());
    }
    lessonsByCourse.get(lesson.course_id)!.add(lesson.id);
  });

  let coursesCompleted = 0;
  lessonsByCourse.forEach((lessonIds) => {
    const completedInCourse = Array.from(lessonIds).filter(id => completedLessonIds.has(id)).length;
    if (completedInCourse === lessonIds.size && lessonIds.size > 0) {
      coursesCompleted++;
    }
  });

  // Calculate lesson-based completion rate (all time, not time-bound)
  const totalLessons = allLessons.length;
  const totalCompletedLessons = completedLessonIds.size;

  // Watch time
  const totalWatchTimeSeconds = currentProgress.reduce(
    (sum, p) => sum + (p.watch_duration_seconds || 0),
    0
  );
  const previousWatchTimeSeconds = previousProgress
    ? previousProgress.reduce((sum, p) => sum + (p.watch_duration_seconds || 0), 0)
    : null;

  // Learning streak
  const allCompletionDates = progress
    .filter(p => p.completed_at)
    .map(p => new Date(p.completed_at));
  const learningStreak = calculateLearningStreak(allCompletionDates);

  // Daily lessons for sparkline
  const dailyLessons = generateDailyBreakdown(
    currentProgress.map(p => ({ date: new Date(p.completed_at) })),
    days,
    end
  );

  return {
    lessonsCompleted: currentProgress.length,
    previousLessonsCompleted: previousProgress?.length ?? null,
    coursesCompleted,
    previousCoursesCompleted: null, // Complex to calculate for previous period
    totalWatchTimeSeconds,
    previousWatchTimeSeconds,
    learningStreak,
    courseCompletionRate: totalLessons > 0 ? (totalCompletedLessons / totalLessons) * 100 : 0,
    dailyLessons,
  };
}

// Fetch job search metrics
async function fetchJobSearchData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  start: Date | null,
  end: Date,
  prevStart: Date | null,
  prevEnd: Date | null,
  days: number
): Promise<JobSearchMetrics> {
  // Get all job applications
  const { data: allJobs } = await supabase
    .from('job_applications')
    .select('id, status, created_at')
    .eq('user_id', userId);

  const jobs = allJobs || [];

  // Filter by date range
  const currentJobs = start
    ? jobs.filter(j => {
        const date = new Date(j.created_at);
        return date >= start && date <= end;
      })
    : jobs;

  const previousJobs = prevStart && prevEnd
    ? jobs.filter(j => {
        const date = new Date(j.created_at);
        return date >= prevStart && date <= prevEnd;
      })
    : null;

  // Count by status
  const statusCounts = {
    wishlist: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
    accepted: 0,
  };

  jobs.forEach(job => {
    const status = job.status as keyof typeof statusCounts;
    if (status in statusCounts) {
      statusCounts[status]++;
    }
  });

  // Active = not rejected, withdrawn, or accepted
  const activeApplications = jobs.filter(
    j => !['rejected', 'withdrawn', 'accepted'].includes(j.status)
  ).length;

  // Calculate rates
  const totalWithResponse = statusCounts.interviewing + statusCounts.offer + statusCounts.rejected + statusCounts.accepted;
  const interviewRate = jobs.length > 0
    ? ((statusCounts.interviewing + statusCounts.offer + statusCounts.accepted) / jobs.length) * 100
    : 0;
  const offerRate = jobs.length > 0
    ? ((statusCounts.offer + statusCounts.accepted) / jobs.length) * 100
    : 0;

  // Get contacts
  let contactsQuery = supabase.from('contacts').select('id, created_at').eq('user_id', userId);
  const { data: allContacts } = await contactsQuery;
  const contacts = allContacts || [];

  const currentContacts = start
    ? contacts.filter(c => {
        const date = new Date(c.created_at);
        return date >= start && date <= end;
      })
    : contacts;

  const previousContacts = prevStart && prevEnd
    ? contacts.filter(c => {
        const date = new Date(c.created_at);
        return date >= prevStart && date <= prevEnd;
      })
    : null;

  // Get unique companies researched by this user
  // Query from user_company_research table which tracks per-user access
  let researchQuery = supabase
    .from('user_company_research')
    .select('company_id, last_accessed_at')
    .eq('user_id', userId);

  // Apply time range filter (if not "all time")
  if (start) {
    researchQuery = researchQuery
      .gte('last_accessed_at', start.toISOString())
      .lte('last_accessed_at', end.toISOString());
  }

  const { data: userResearch } = await researchQuery;
  const companiesResearched = new Set(userResearch?.map(r => r.company_id) || []).size;

  // Daily applications for sparkline
  const dailyApplications = generateDailyBreakdown(
    currentJobs.map(j => ({ date: new Date(j.created_at) })),
    days,
    end
  );

  return {
    totalApplications: currentJobs.length,
    previousTotalApplications: previousJobs?.length ?? null,
    activeApplications,
    applicationsByStatus: statusCounts,
    interviewRate,
    offerRate,
    contactsCount: currentContacts.length,
    previousContactsCount: previousContacts?.length ?? null,
    companiesResearched,
    dailyApplications,
  };
}

// Fetch interview metrics
async function fetchInterviewData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  start: Date | null,
  end: Date,
  prevStart: Date | null,
  prevEnd: Date | null
): Promise<InterviewMetrics> {
  // Get mock interviews
  // Note: interview_mode is the column name, ai_evaluation contains the verdict
  const { data: allInterviews } = await supabase
    .from('mock_interviews')
    .select('id, created_at, duration_seconds, interview_mode, ai_evaluation')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  const interviews = allInterviews || [];

  // Filter by date range
  const currentInterviews = start
    ? interviews.filter(i => {
        const date = new Date(i.created_at);
        return date >= start && date <= end;
      })
    : interviews;

  const previousInterviews = prevStart && prevEnd
    ? interviews.filter(i => {
        const date = new Date(i.created_at);
        return date >= prevStart && date <= prevEnd;
      })
    : null;

  // Calculate scores based on ai_evaluation.overallVerdict
  // Verdicts: "Strong Hire"=4, "Hire"=3, "No Hire"=2, "Weak"=1
  const verdictToScore: Record<string, number> = {
    'Strong Hire': 4,
    'Hire': 3,
    'No Hire': 2,
    'Weak': 1,
  };

  // Helper to extract verdict from ai_evaluation JSONB
  const getVerdict = (interview: typeof interviews[0]): string | null => {
    const aiEval = interview.ai_evaluation as { overallVerdict?: string } | null;
    return aiEval?.overallVerdict || null;
  };

  const currentScores = currentInterviews
    .map(i => {
      const verdict = getVerdict(i);
      return verdict && verdictToScore[verdict] ? verdictToScore[verdict] : null;
    })
    .filter((score): score is number => score !== null);

  const previousScores = previousInterviews
    ?.map(i => {
      const verdict = getVerdict(i);
      return verdict && verdictToScore[verdict] ? verdictToScore[verdict] : null;
    })
    .filter((score): score is number => score !== null) || null;

  const averageScore = currentScores.length > 0
    ? currentScores.reduce((a, b) => a + b, 0) / currentScores.length
    : null;

  const previousAverageScore = previousScores && previousScores.length > 0
    ? previousScores.reduce((a, b) => a + b, 0) / previousScores.length
    : null;

  // Practice hours
  const practiceHours = currentInterviews.reduce(
    (sum, i) => sum + (i.duration_seconds || 0),
    0
  ) / 3600;

  // Types practiced (using interview_mode)
  const typesPracticed = new Set(
    currentInterviews.map(i => i.interview_mode).filter(Boolean)
  ).size;

  // Score history for sparkline (last 10 interviews with scores)
  const recentScores = interviews
    .map(i => {
      const verdict = getVerdict(i);
      return verdict && verdictToScore[verdict] ? verdictToScore[verdict] : null;
    })
    .filter((score): score is number => score !== null)
    .slice(-10);

  return {
    mockInterviewsCompleted: currentInterviews.length,
    previousMockInterviews: previousInterviews?.length ?? null,
    averageScore,
    previousAverageScore,
    practiceHours,
    typesPracticed,
    scoreHistory: recentScores,
  };
}

// Fetch resume metrics
async function fetchResumeData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  start: Date | null,
  end: Date,
  prevStart: Date | null,
  prevEnd: Date | null
): Promise<ResumeMetrics> {
  // Get resume versions
  const { data: allVersions } = await supabase
    .from('resume_versions')
    .select('id, created_at, is_master')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  const versions = allVersions || [];

  // Filter by date range
  const currentVersions = start
    ? versions.filter(v => {
        const date = new Date(v.created_at);
        return date >= start && date <= end;
      })
    : versions;

  const previousVersions = prevStart && prevEnd
    ? versions.filter(v => {
        const date = new Date(v.created_at);
        return date >= prevStart && date <= prevEnd;
      })
    : null;

  // Get resume analyses
  const { data: analyses } = await supabase
    .from('resume_analyses')
    .select('overall_score, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  const allAnalyses = analyses || [];

  const currentAnalyses = start
    ? allAnalyses.filter(a => {
        const date = new Date(a.created_at);
        return date >= start && date <= end;
      })
    : allAnalyses;

  const previousAnalyses = prevStart && prevEnd
    ? allAnalyses.filter(a => {
        const date = new Date(a.created_at);
        return date >= prevStart && date <= prevEnd;
      })
    : null;

  const highestScore = currentAnalyses.length > 0
    ? Math.max(...currentAnalyses.map(a => a.overall_score || 0))
    : null;

  const previousHighestScore = previousAnalyses && previousAnalyses.length > 0
    ? Math.max(...previousAnalyses.map(a => a.overall_score || 0))
    : null;

  // Score improvement (first to last)
  let scoreImprovement: number | null = null;
  if (allAnalyses.length >= 2) {
    const firstScore = allAnalyses[0].overall_score || 0;
    const lastScore = allAnalyses[allAnalyses.length - 1].overall_score || 0;
    scoreImprovement = lastScore - firstScore;
  }

  // Job-specific resumes (non-master)
  const jobSpecificResumes = versions.filter(v => !v.is_master).length;

  return {
    versionsCount: currentVersions.length,
    previousVersionsCount: previousVersions?.length ?? null,
    highestScore,
    previousHighestScore,
    scoreImprovement,
    jobSpecificResumes,
  };
}

// Fetch portfolio metrics
async function fetchPortfolioData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  start: Date | null,
  end: Date,
  prevStart: Date | null,
  prevEnd: Date | null
): Promise<PortfolioMetrics> {
  // Get portfolio with published status
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('id, is_published')
    .eq('user_id', userId)
    .maybeSingle();

  const isPublished = portfolio?.is_published ?? false;

  // Get portfolio pages - must join through portfolio_id since pages don't have user_id
  let pages: { id: string; created_at: string; is_published: boolean }[] = [];

  if (portfolio?.id) {
    const { data: allPages } = await supabase
      .from('portfolio_pages')
      .select('id, created_at, is_published')
      .eq('portfolio_id', portfolio.id);

    pages = allPages || [];
  }

  // Calculate page counts
  const totalPages = pages.length;
  const publishedPages = pages.filter(p => p.is_published).length;
  const draftPages = totalPages - publishedPages;

  // Filter by date range for previous period comparison
  const previousPages = prevStart && prevEnd
    ? pages.filter(p => {
        const date = new Date(p.created_at);
        return date >= prevStart && date <= prevEnd;
      })
    : null;

  return {
    isPublished,
    totalPages,
    publishedPages,
    draftPages,
    previousTotalPages: previousPages?.length ?? null,
  };
}
