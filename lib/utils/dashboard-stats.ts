import { createClient } from '@/lib/supabase/server';
import { getUserSubscription } from '@/lib/utils/subscription';
import type { DashboardStats } from '@/app/api/dashboard/stats/route';

export const getDashboardStats = async (userId: string): Promise<DashboardStats | null> => {
  try {
    const supabase = await createClient();

    // Fetch all data in parallel
    const [
      progressData,
      resumeData,
      jobApplicationsData,
      contactsData,
      researchData,
      subscription,
    ] = await Promise.all([
      // Course Progress
      Promise.all([
        // Completed lessons count
        supabase
          .from('user_progress')
          .select('lesson_id, completed, completed_at, watch_duration_seconds')
          .eq('user_id', userId)
          .eq('completed', true),
        // All lessons to calculate courses
        supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', userId),
        // Get all lessons to check course completion
        supabase
          .from('lessons')
          .select('id, course_id'),
        // Get all courses
        supabase
          .from('courses')
          .select('id'),
      ]),
      
      // Resume Stats
      Promise.all([
        supabase
          .from('resume_versions')
          .select('id, created_at')
          .eq('user_id', userId),
        supabase
          .from('resume_analyses')
          .select('overall_score')
          .eq('user_id', userId)
          .order('overall_score', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]),
      
      // Job Applications
      supabase
        .from('job_applications')
        .select('status, created_at')
        .eq('user_id', userId),
      
      // Contacts
      supabase
        .from('contacts')
        .select('id, created_at')
        .eq('user_id', userId),
      
      // Company Research (check companies user has applications for)
      supabase
        .from('job_applications')
        .select('company_id')
        .eq('user_id', userId),
      
      // Subscription
      getUserSubscription(userId),
    ]);

    // Process Course Progress
    const [completedLessonsResult, allProgressResult, allLessonsResult, allCoursesResult] = progressData;
    const completedLessons = completedLessonsResult.data || [];
    const allProgress = allProgressResult.data || [];
    const allLessons = allLessonsResult.data || [];
    const allCourses = allCoursesResult.data || [];

    const lessonsCompleted = completedLessons.length;
    const totalWatchTime = completedLessons.reduce((sum, lesson) => 
      sum + (lesson.watch_duration_seconds || 0), 0
    );

    // Calculate courses completed (course is complete if all its lessons are completed)
    const lessonsByCourse = new Map<string, Set<string>>();
    allLessons.forEach(lesson => {
      if (!lessonsByCourse.has(lesson.course_id)) {
        lessonsByCourse.set(lesson.course_id, new Set());
      }
      lessonsByCourse.get(lesson.course_id)!.add(lesson.id);
    });

    const completedLessonIds = new Set(completedLessons.map(l => l.lesson_id));
    let coursesCompleted = 0;
    lessonsByCourse.forEach((lessonIds, courseId) => {
      const allCompleted = Array.from(lessonIds).every(id => completedLessonIds.has(id));
      if (allCompleted && lessonIds.size > 0) {
        coursesCompleted++;
      }
    });

    // Check first lesson watched
    const firstLessonWatched = completedLessons.length > 0;
    const firstCourseCompleted = coursesCompleted > 0;

    // Process Resume Stats
    const [resumeVersionsResult, resumeAnalysisResult] = resumeData;
    const resumeVersions = resumeVersionsResult.data || [];
    const resumeVersionsCount = resumeVersions.length;
    const hasImportedResume = resumeVersionsCount > 0;
    const highestResumeScore = resumeAnalysisResult.data?.overall_score || null;

    // Process Job Applications
    const jobApplications = jobApplicationsData.data || [];
    const totalJobApplications = jobApplications.length;
    const jobApplicationsByStatus = {
      wishlist: jobApplications.filter(j => j.status === 'wishlist').length,
      applied: jobApplications.filter(j => j.status === 'applied').length,
      interviewing: jobApplications.filter(j => j.status === 'interviewing').length,
      offer: jobApplications.filter(j => j.status === 'offer').length,
      rejected: jobApplications.filter(j => j.status === 'rejected').length,
      withdrawn: jobApplications.filter(j => j.status === 'withdrawn').length,
    };
    const firstJobAdded = totalJobApplications > 0;

    // Process Contacts
    const contacts = contactsData.data || [];
    const contactsCount = contacts.length;
    const firstContactAdded = contactsCount > 0;

    // Process Company Research
    const companyIds = new Set((researchData.data || []).map(j => j.company_id));
    const companiesResearchedCount = companyIds.size;
    
    // Check if user has viewed research (has applications with companies that have research)
    let firstResearchViewed = false;
    if (companyIds.size > 0) {
      const { data: researchCheck } = await supabase
        .from('company_research')
        .select('company_id')
        .in('company_id', Array.from(companyIds));
      firstResearchViewed = (researchCheck?.length || 0) > 0;
    }

    // Check template access from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_template_accessed_at')
      .eq('user_id', userId)
      .maybeSingle();
    
    const firstTemplateAccessed = profile?.first_template_accessed_at !== null;

    // Process Milestones
    const milestones = {
      firstLessonWatched,
      firstCourseCompleted,
      firstResumeImported: hasImportedResume,
      resumeScore70: highestResumeScore !== null && highestResumeScore >= 70,
      resumeScore80: highestResumeScore !== null && highestResumeScore >= 80,
      resumeScore90: highestResumeScore !== null && highestResumeScore >= 90,
      firstTemplateAccessed,
      firstJobAdded,
      firstContactAdded,
      firstResearchViewed,
    };

    // Build response
    const stats: DashboardStats = {
      lessonsCompleted,
      coursesCompleted,
      totalWatchTime,
      resumeVersionsCount,
      highestResumeScore,
      hasImportedResume,
      totalJobApplications,
      jobApplicationsByStatus,
      contactsCount,
      companiesResearchedCount,
      subscription: {
        plan: subscription?.plan || null,
        status: subscription?.status || null,
        isActive: subscription?.status === 'active' || subscription?.status === 'trialing',
      },
      milestones,
    };

    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
};

