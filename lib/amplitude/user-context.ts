'use client';

import { createClient } from '@/lib/supabase/client';
import { getUserSubscription } from '@/lib/utils/subscription';

export interface UserContext {
  // Subscription context
  'User Subscription Plan': 'free' | 'learn' | 'accelerate' | 'none';
  'User Subscription Status': 'active' | 'trialing' | 'canceled' | 'past_due' | 'none';
  'User Has Active Subscription': boolean;
  'User Subscription Billing Cadence': 'monthly' | 'quarterly' | 'yearly' | 'none';
  'Days Since Subscription Started': number | null;
  'Days Until Subscription Renewal': number | null;
  'Is Trial User': boolean;

  // Onboarding context
  'User Onboarding Complete': boolean;
  'Days Since Sign Up': number | null;
  'User First Course Started': boolean;
  'User First Lesson Completed': boolean;
  'User Total Courses Started': number;
  'User Total Lessons Completed': number;
  'User Total Lessons Started': number;

  // Authentication
  'User Authentication Status': 'authenticated' | 'anonymous';
}

/**
 * Get user context for Amplitude tracking
 * Fetches subscription, progress, and onboarding state
 * Returns default values if user is not authenticated or if there's an error
 */
export const getUserContext = async (): Promise<UserContext> => {
  const defaultContext: UserContext = {
    'User Subscription Plan': 'none',
    'User Subscription Status': 'none',
    'User Has Active Subscription': false,
    'User Subscription Billing Cadence': 'none',
    'Days Since Subscription Started': null,
    'Days Until Subscription Renewal': null,
    'Is Trial User': false,
    'User Onboarding Complete': false,
    'Days Since Sign Up': null,
    'User First Course Started': false,
    'User First Lesson Completed': false,
    'User Total Courses Started': 0,
    'User Total Lessons Completed': 0,
    'User Total Lessons Started': 0,
    'User Authentication Status': 'anonymous',
  };

  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return defaultContext;
    }

    // User is authenticated
    defaultContext['User Authentication Status'] = 'authenticated';

    // Fetch subscription, progress, and user data in parallel
    const [subscriptionResult, progressResult, userDataResult] = await Promise.all([
      // Get subscription directly from database
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Get user progress
      supabase
        .from('user_progress')
        .select('lesson_id, completed, last_watched_at')
        .eq('user_id', user.id),
      // Get user metadata for signup date
      supabase.auth.getUser(),
    ]);

    // Process subscription
    if (subscriptionResult.data) {
      const sub = subscriptionResult.data;
      defaultContext['User Subscription Plan'] = sub.plan || 'free';
      defaultContext['User Subscription Status'] = sub.status || 'none';
      defaultContext['User Has Active Subscription'] = ['active', 'trialing', 'past_due'].includes(sub.status);
      defaultContext['User Subscription Billing Cadence'] = sub.billing_cadence || 'none';
      defaultContext['Is Trial User'] = sub.status === 'trialing';

      // Calculate days since subscription started
      if (sub.created_at) {
        const startDate = new Date(sub.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - startDate.getTime());
        defaultContext['Days Since Subscription Started'] = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate days until renewal
      if (sub.current_period_end && defaultContext['User Has Active Subscription']) {
        const endDate = new Date(sub.current_period_end);
        const now = new Date();
        const diffTime = Math.abs(endDate.getTime() - now.getTime());
        defaultContext['Days Until Subscription Renewal'] = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
    } else {
      // No active subscription - check if user has any subscription history
      const { data: anySub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (!anySub) {
        defaultContext['User Subscription Plan'] = 'free';
      }
    }

    // Process user progress
    if (progressResult.data) {
      const progress = progressResult.data;
      const completedLessons = progress.filter(p => p.completed);
      const startedLessons = progress.filter(p => p.last_watched_at);

      defaultContext['User Total Lessons Completed'] = completedLessons.length;
      defaultContext['User Total Lessons Started'] = startedLessons.length;
      defaultContext['User First Lesson Completed'] = completedLessons.length > 0;

      // Check if user has started any course (has progress on any lesson)
      defaultContext['User First Course Started'] = startedLessons.length > 0;

      // Get unique course IDs from lessons
      if (startedLessons.length > 0) {
        const lessonIds = startedLessons.map(p => p.lesson_id);
        const { data: lessons } = await supabase
          .from('lessons')
          .select('course_id')
          .in('id', lessonIds);
        
        if (lessons) {
          const uniqueCourseIds = new Set(lessons.map(l => l.course_id));
          defaultContext['User Total Courses Started'] = uniqueCourseIds.size;
        }
      }
    }

    // Process user signup date
    if (userDataResult.data?.user?.created_at) {
      const signupDate = new Date(userDataResult.data.user.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - signupDate.getTime());
      defaultContext['Days Since Sign Up'] = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Determine onboarding complete (has completed at least one lesson and started at least one course)
    defaultContext['User Onboarding Complete'] = 
      defaultContext['User First Lesson Completed'] && 
      defaultContext['User First Course Started'];

  } catch (error) {
    // Silently fail - return default context
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Error fetching user context (non-blocking):', error);
    }
  }

  return defaultContext;
};

/**
 * Get course-specific user context
 * Includes progress for a specific course
 */
export const getCourseUserContext = async (
  courseId: string,
  baseContext?: UserContext
): Promise<UserContext & {
  'User Course Progress Percentage': number;
  'User Completed Lessons in Course': number;
  'User Started Lessons in Course': number;
}> => {
  const context = baseContext || await getUserContext();
  
  const courseContext = {
    ...context,
    'User Course Progress Percentage': 0,
    'User Completed Lessons in Course': 0,
    'User Started Lessons in Course': 0,
  };

  if (context['User Authentication Status'] === 'anonymous') {
    return courseContext;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return courseContext;
    }

    // Get all lessons in course
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);

    if (!lessons || lessons.length === 0) {
      return courseContext;
    }

    const lessonIds = lessons.map(l => l.id);

    // Get user progress for lessons in this course
    const { data: progress } = await supabase
      .from('user_progress')
      .select('lesson_id, completed, last_watched_at')
      .eq('user_id', user.id)
      .in('lesson_id', lessonIds);

    if (progress) {
      const completed = progress.filter(p => p.completed);
      const started = progress.filter(p => p.last_watched_at);

      courseContext['User Completed Lessons in Course'] = completed.length;
      courseContext['User Started Lessons in Course'] = started.length;
      courseContext['User Course Progress Percentage'] = Math.round(
        (completed.length / lessons.length) * 100
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Error fetching course context (non-blocking):', error);
    }
  }

  return courseContext;
};

/**
 * Get lesson-specific user context
 * Includes progress for a specific lesson
 */
export const getLessonUserContext = async (
  lessonId: string,
  courseId: string,
  baseContext?: UserContext
): Promise<UserContext & {
  'User Has Completed Lesson': boolean;
  'User Has Started Lesson': boolean;
  'User Watch Duration Seconds': number;
  'User Course Progress Percentage': number;
  'User Completed Lessons in Course': number;
  'User Started Lessons in Course': number;
}> => {
  const context = baseContext || await getUserContext();
  
  const lessonContext = {
    ...context,
    'User Has Completed Lesson': false,
    'User Has Started Lesson': false,
    'User Watch Duration Seconds': 0,
    'User Course Progress Percentage': 0,
    'User Completed Lessons in Course': 0,
    'User Started Lessons in Course': 0,
  };

  if (context['User Authentication Status'] === 'anonymous') {
    return lessonContext;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return lessonContext;
    }

    // Get lesson progress
    const { data: lessonProgress } = await supabase
      .from('user_progress')
      .select('completed, watch_duration_seconds, last_watched_at')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (lessonProgress) {
      lessonContext['User Has Completed Lesson'] = lessonProgress.completed || false;
      lessonContext['User Has Started Lesson'] = !!lessonProgress.last_watched_at;
      lessonContext['User Watch Duration Seconds'] = lessonProgress.watch_duration_seconds || 0;
    }

    // Get course progress
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);

    if (lessons && lessons.length > 0) {
      const lessonIds = lessons.map(l => l.id);

      const { data: courseProgress } = await supabase
        .from('user_progress')
        .select('lesson_id, completed, last_watched_at')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      if (courseProgress) {
        const completed = courseProgress.filter(p => p.completed);
        const started = courseProgress.filter(p => p.last_watched_at);

        lessonContext['User Completed Lessons in Course'] = completed.length;
        lessonContext['User Started Lessons in Course'] = started.length;
        lessonContext['User Course Progress Percentage'] = Math.round(
          (completed.length / lessons.length) * 100
        );
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Error fetching lesson context (non-blocking):', error);
    }
  }

  return lessonContext;
};

