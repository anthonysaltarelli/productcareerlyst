import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import LessonPlayer from '@/app/components/LessonPlayer';
import LessonNavigator from '@/app/components/LessonNavigator';
import LessonContentWrapper from '@/app/components/LessonContentWrapper';

interface Lesson {
  id: string;
  title: string;
  video_url: string;
  prioritization: string;
  requires_subscription: boolean;
  course_id: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
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
          description
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
      .select('id, title, video_url, prioritization, requires_subscription, course_id')
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

  const isCurrentLessonCompleted = progressMap[lesson.id] || false;

  // Find current lesson index and next/previous lessons
  const currentIndex = course.lessons.findIndex((l: Lesson) => l.id === lesson.id);
  const previousLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-gray-600">
          <li>
            <Link href="/dashboard/courses" className="hover:text-indigo-600">
              Courses
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/dashboard/courses/${slug}`} className="hover:text-indigo-600">
              {course.title}
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">{lesson.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Video Player */}
            <LessonPlayer videoUrl={lesson.video_url} lessonId={lesson.id} />

            {/* Lesson Info */}
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
              <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                <div className="flex-1 flex justify-start">
                  {previousLesson && (
                    <Link
                      href={`/dashboard/courses/${slug}/lessons/${previousLesson.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </Link>
                  )}
                </div>

                {/* Completion Button in Center */}
                <div className="flex-shrink-0">
                  <LessonContentWrapper 
                    lessonId={lesson.id}
                    isCompleted={isCurrentLessonCompleted}
                  />
                </div>

                <div className="flex-1 flex justify-end">
                  {nextLesson ? (
                    <Link
                      href={`/dashboard/courses/${slug}/lessons/${nextLesson.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                    >
                      Next Lesson
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/courses`}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      Complete Course
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Course Lessons */}
        <div className="lg:col-span-1">
          <LessonNavigator
            lessons={course.lessons}
            currentLessonId={lesson.id}
            courseSlug={slug}
            initialProgress={progressMap}
          />
        </div>
      </div>
    </div>
  );
}

