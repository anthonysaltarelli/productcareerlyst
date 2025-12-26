import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import LessonPlayer from '@/app/components/LessonPlayer';
import LessonNavigator from '@/app/components/LessonNavigator';
import LessonContentWrapper from '@/app/components/LessonContentWrapper';
import { LessonPageTracking } from '@/app/components/LessonPageTracking';
import { TrackedLink } from '@/app/components/TrackedLink';
import { PremiumLessonGate } from '@/app/components/PremiumLessonGate';
import { getUserPlan } from '@/lib/utils/subscription';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';
import { LessonsPageMobileGate } from '@/app/components/LessonsPageMobileGate';

interface Lesson {
  id: string;
  title: string;
  video_url: string;
  prioritization: string;
  requires_subscription: boolean;
  course_id: string;
  duration_minutes?: number | null;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  category_id?: string | null;
  categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  lessons: Lesson[];
}

interface ProgressMap {
  [lessonId: string]: boolean;
}

const getLessonDataOptimized = async (lessonId: string) => {
  const supabase = await createClient();
  
  // Run all queries in parallel for better performance
  const [lessonResult, userResult] = await Promise.all([
    supabase
      .from('lessons')
      .select(`
        id,
        title,
        video_url,
        prioritization,
        requires_subscription,
        course_id,
        courses (
          id,
          title,
          slug,
          description,
          category_id,
          categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq('id', lessonId)
      .single(),
    supabase.auth.getUser()
  ]);

  const { data: lesson, error: lessonError } = lessonResult;
  
  if (lessonError || !lesson) {
    return null;
  }

  // Now fetch lessons and progress in parallel
  const [lessonsResult, progressResult] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, video_url, prioritization, requires_subscription, course_id, duration_minutes')
      .eq('course_id', lesson.course_id)
      .order('prioritization', { ascending: true }),
    userResult.data.user
      ? supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', userResult.data.user.id)
          .eq('lesson_id', lessonId)  // Only get progress for lessons in this course
      : Promise.resolve({ data: null })
  ]);

  const { data: allLessons, error: lessonsError } = lessonsResult;
  
  if (lessonsError || !allLessons) {
    return null;
  }

  // Get all progress for lessons in this course
  let progressMap: ProgressMap = {};
  if (userResult.data.user) {
    const lessonIds = allLessons.map(l => l.id);
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('lesson_id, completed')
      .eq('user_id', userResult.data.user.id)
      .in('lesson_id', lessonIds);

    if (progressData) {
      progressData.forEach(progress => {
        progressMap[progress.lesson_id] = progress.completed;
      });
    }
  }

  // Sort lessons by prioritization
  const sortedLessons = allLessons.sort((a, b) => {
    const parseSort = (val: string) => {
      const parts = val.split('.');
      return parts.map((p, i) => parseFloat(p) * Math.pow(1000, -i)).reduce((a, b) => a + b, 0);
    };
    return parseSort(a.prioritization) - parseSort(b.prioritization);
  });

  const course = Array.isArray(lesson.courses) ? lesson.courses[0] : lesson.courses;

  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      video_url: lesson.video_url,
      prioritization: lesson.prioritization,
      requires_subscription: lesson.requires_subscription,
      course_id: lesson.course_id
    },
    course: {
      ...course,
      lessons: sortedLessons
    },
    progressMap
  };
};

export default async function LessonPage({
  params
}: {
  params: Promise<{ slug: string; lessonId: string }>
}) {
  const { slug, lessonId } = await params;
  const data = await getLessonDataOptimized(lessonId);

  if (!data) {
    notFound();
  }

  const { lesson, course, progressMap } = data;

  // Check if user has access to premium lesson
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userPlan: 'learn' | 'accelerate' | null = null;
  if (user) {
    userPlan = await getUserPlan(user.id);
  }

  // Check if lesson requires subscription and user doesn't have access
  const requiresSubscription = lesson.requires_subscription;
  const hasAccess = userPlan === 'learn' || userPlan === 'accelerate';
  const shouldShowGate = requiresSubscription && !hasAccess;

  const isCurrentLessonCompleted = progressMap[lesson.id] || false;

  // Find current lesson index and next/previous lessons
  const currentIndex = course.lessons.findIndex((l: Lesson) => l.id === lesson.id);
  const previousLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;

  // Get category information
  const category = Array.isArray(course.categories) ? course.categories[0] : course.categories;

  // Calculate lesson position number (extract numeric part from prioritization like "1.1" -> 1)
  const lessonPositionNumber = parseInt(lesson.prioritization.split('.')[0]) || currentIndex + 1;

  return (
    <LessonsPageMobileGate lessonTitle={lesson.title}>
      <div className="min-h-screen bg-gray-50">
      <MobileDashboardHeader
        title={lesson.title}
        showBackButton
        backHref={`/dashboard/courses`}
        backLabel="Courses"
      />
      <div className="max-w-7xl mx-auto p-4 pt-20 md:p-6 md:pt-6">
        <LessonPageTracking
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        lessonPosition={lesson.prioritization}
        lessonPositionNumber={lessonPositionNumber}
        lessonRequiresSubscription={lesson.requires_subscription}
        courseId={course.id}
        courseTitle={course.title}
        courseSlug={slug}
        courseCategory={category?.name || 'Unknown'}
        totalLessonsInCourse={course.lessons.length}
        previousLessonId={previousLesson?.id || null}
        previousLessonTitle={previousLesson?.title || null}
        nextLessonId={nextLesson?.id || null}
        nextLessonTitle={nextLesson?.title || null}
        isFirstLesson={currentIndex === 0}
        isLastLesson={currentIndex === course.lessons.length - 1}
        videoUrl={lesson.video_url}
      />
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-gray-600">
          <li>
            <TrackedLink
              href="/dashboard/courses"
              linkId="lesson-page-breadcrumb-courses"
              eventName="User Clicked Courses Breadcrumb"
              eventProperties={{
                'Current Lesson ID': lesson.id,
                'Current Course ID': course.id,
                'Current Lesson Completed': isCurrentLessonCompleted,
                'Link Section': 'Breadcrumb Navigation',
                'Link Position': 'First breadcrumb item',
              }}
              className="hover:text-indigo-600"
            >
              Courses
            </TrackedLink>
          </li>
          <li>/</li>
          <li>
            <TrackedLink
              href={`/dashboard/courses/${slug}`}
              linkId={`lesson-page-breadcrumb-course-${slug}`}
              eventName="User Clicked Course Breadcrumb"
              eventProperties={{
                'Current Lesson ID': lesson.id,
                'Course ID': course.id,
                'Course Title': course.title,
                'Course Slug': slug,
                'Current Lesson Completed': isCurrentLessonCompleted,
                'Link Section': 'Breadcrumb Navigation',
                'Link Position': 'Second breadcrumb item',
              }}
              className="hover:text-indigo-600"
            >
              {course.title}
            </TrackedLink>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">{lesson.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
            {/* Show gate if premium lesson and no access, otherwise show video */}
            {shouldShowGate ? (
              <PremiumLessonGate
                lessonTitle={lesson.title}
                lessonId={lesson.id}
                courseTitle={course.title}
                courseId={course.id}
                currentPlan={userPlan}
              />
            ) : (
              <>
            {/* Video Player */}
            <LessonPlayer 
              videoUrl={lesson.video_url} 
              lessonId={lesson.id}
              courseId={course.id}
              lessonTitle={lesson.title}
              courseTitle={course.title}
            />
              </>
            )}

            {/* Lesson Info - Only show if user has access */}
            {!shouldShowGate && (
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
                  <p className="text-sm text-gray-500">
                    Lesson {lesson.prioritization} of {course.lessons.length}
                  </p>
                </div>
                {lesson.requires_subscription && (
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                    Premium
                  </span>
                )}
              </div>

              {/* Navigation Bar with Completion Button */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-3 md:gap-4 pt-6 border-t border-gray-200">
                {/* Completion Button - First on mobile, center on desktop */}
                <div className="w-full md:w-auto md:flex-shrink-0 md:order-2">
                  <LessonContentWrapper 
                    lessonId={lesson.id}
                    courseId={course.id}
                    lessonTitle={lesson.title}
                    courseTitle={course.title}
                    isCompleted={isCurrentLessonCompleted}
                  />
                </div>

                {/* Next Lesson Button - Second on mobile, right on desktop */}
                {nextLesson && (
                  <TrackedLink
                    href={`/dashboard/courses/${slug}/lessons/${nextLesson.id}`}
                    linkId="lesson-page-next-lesson-link"
                    eventName="User Clicked Next Lesson Link"
                    eventProperties={{
                      'Current Lesson ID': lesson.id,
                      'Current Lesson Title': lesson.title,
                      'Next Lesson ID': nextLesson.id,
                      'Next Lesson Title': nextLesson.title,
                      'Course ID': course.id,
                      'Course Slug': slug,
                      'Current Lesson Completed': isCurrentLessonCompleted,
                      'Is Last Lesson': false,
                      'Link Section': 'Lesson Navigation Bar',
                      'Link Position': 'Right side of Navigation Bar',
                    }}
                    className="flex items-center justify-center gap-2 w-full md:w-auto md:max-w-[140px] md:order-3 px-4 py-3 md:py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    Next Lesson
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </TrackedLink>
                )}

                {/* Previous Lesson Button - Third on mobile, left on desktop */}
                {previousLesson && (
                  <TrackedLink
                    href={`/dashboard/courses/${slug}/lessons/${previousLesson.id}`}
                    linkId="lesson-page-previous-lesson-link"
                    eventName="User Clicked Previous Lesson Link"
                    eventProperties={{
                      'Current Lesson ID': lesson.id,
                      'Current Lesson Title': lesson.title,
                      'Previous Lesson ID': previousLesson.id,
                      'Previous Lesson Title': previousLesson.title,
                      'Course ID': course.id,
                      'Course Slug': slug,
                      'Current Lesson Completed': isCurrentLessonCompleted,
                      'Link Section': 'Lesson Navigation Bar',
                      'Link Position': 'Left side of Navigation Bar',
                    }}
                    className="flex items-center justify-center gap-2 w-full md:w-auto md:max-w-[120px] md:order-1 px-4 py-3 md:py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </TrackedLink>
                )}
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Sidebar - Course Lessons */}
        <div className="lg:col-span-1">
          <LessonNavigator
            lessons={course.lessons}
            currentLessonId={lesson.id}
            courseSlug={slug}
            courseId={course.id}
            initialProgress={progressMap}
          />
        </div>
        </div>
      </div>
    </div>
    </LessonsPageMobileGate>
  );
}

