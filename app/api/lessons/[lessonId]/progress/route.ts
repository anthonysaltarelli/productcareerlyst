import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { markBaselineActionsComplete, type BaselineTrigger } from '@/lib/utils/baseline-actions';
import { incrementWeeklyGoalProgress } from '@/lib/utils/weekly-goals';

// Map course slugs to baseline triggers
const COURSE_COMPLETION_TRIGGERS: Record<string, BaselineTrigger> = {
  'resume-linkedin': 'course_resume_linkedin_completed',
  'portfolio': 'course_portfolio_completed',
  'secure-referral': 'course_secure_referral_completed',
  'company-prep': 'course_company_prep_completed',
  'pm-interviews': 'course_pm_interviews_completed',
  'negotiation': 'course_negotiation_completed',
  'pm-fundamentals': 'course_pm_fundamentals_completed',
};

// Helper function to check if a course is fully completed and trigger baseline action
async function checkCourseCompletion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  lessonId: string
): Promise<void> {
  try {
    // Get the lesson's course
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('course_id, courses(slug)')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson?.course_id) {
      console.error('Error fetching lesson course:', lessonError);
      return;
    }

    const courses = lesson.courses as { slug: string } | { slug: string }[] | null;
    const courseSlug = Array.isArray(courses) ? courses[0]?.slug : courses?.slug;
    if (!courseSlug) return;

    // Check if this course has a completion trigger
    const trigger = COURSE_COMPLETION_TRIGGERS[courseSlug];
    if (!trigger) return;

    // Count total lessons in the course
    const { count: totalLessons, error: totalError } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', lesson.course_id);

    if (totalError || !totalLessons) {
      console.error('Error counting total lessons:', totalError);
      return;
    }

    // Count completed lessons for this user in this course
    const { count: completedLessons, error: completedError } = await supabase
      .from('user_progress')
      .select('*, lessons!inner(course_id)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true)
      .eq('lessons.course_id', lesson.course_id);

    if (completedError) {
      console.error('Error counting completed lessons:', completedError);
      return;
    }

    // If all lessons are completed, trigger the baseline action
    if (completedLessons === totalLessons) {
      markBaselineActionsComplete(userId, trigger).catch((err) => {
        console.error(`Error marking ${trigger} baseline action:`, err);
      });
    }
  } catch (error) {
    console.error('Error in checkCourseCompletion:', error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const supabase = await createClient();
    const { lessonId } = await params;
    const { completed } = await request.json();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if progress record already exists
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single();

    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('user_progress')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          last_watched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Check if course is now fully completed and increment weekly goal
      if (completed) {
        checkCourseCompletion(supabase, user.id, lessonId);
        // Only increment weekly goal if this is a new completion (was not already completed)
        if (!existingProgress.completed) {
          incrementWeeklyGoalProgress(user.id, 'lesson_completed').catch((err) => {
            console.error('Error incrementing weekly goal for lesson:', err);
          });
        }
      }

      return NextResponse.json({ success: true, data });
    } else {
      // Create new progress record
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          last_watched_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Check if course is now fully completed and increment weekly goal
      if (completed) {
        checkCourseCompletion(supabase, user.id, lessonId);
        // Increment weekly goal for new lesson completion
        incrementWeeklyGoalProgress(user.id, 'lesson_completed').catch((err) => {
          console.error('Error incrementing weekly goal for lesson:', err);
        });
      }

      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const supabase = await createClient();
    const { lessonId } = await params;

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get progress for this lesson
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is ok
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || null });
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

