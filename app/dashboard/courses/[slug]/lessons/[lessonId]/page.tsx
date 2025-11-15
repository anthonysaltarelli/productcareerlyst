import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import LessonPlayer from '@/app/components/LessonPlayer';

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

const getLessonWithCourse = async (lessonId: string): Promise<{ lesson: Lesson; course: Course } | null> => {
  const supabase = await createClient();
  
  const { data: lesson, error: lessonError } = await supabase
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
    .single();

  if (lessonError || !lesson) {
    return null;
  }

  // Get all lessons for the course
  const { data: allLessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, video_url, prioritization, requires_subscription, course_id')
    .eq('course_id', lesson.course_id)
    .order('prioritization', { ascending: true });

  if (lessonsError || !allLessons) {
    return null;
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
    }
  };
};

export default async function LessonPage({ 
  params 
}: { 
  params: { slug: string; lessonId: string } 
}) {
  const data = await getLessonWithCourse(params.lessonId);

  if (!data) {
    notFound();
  }

  const { lesson, course } = data;

  // Find current lesson index and next/previous lessons
  const currentIndex = course.lessons.findIndex(l => l.id === lesson.id);
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
            <Link href={`/dashboard/courses/${params.slug}`} className="hover:text-indigo-600">
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

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                {previousLesson ? (
                  <Link
                    href={`/dashboard/courses/${params.slug}/lessons/${previousLesson.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </Link>
                ) : (
                  <div />
                )}

                {nextLesson ? (
                  <Link
                    href={`/dashboard/courses/${params.slug}/lessons/${nextLesson.id}`}
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

        {/* Sidebar - Course Lessons */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h2>
            <div className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto">
              {course.lessons.map((l, index) => (
                <Link
                  key={l.id}
                  href={`/dashboard/courses/${params.slug}/lessons/${l.id}`}
                  className={`block p-3 rounded-lg transition-colors ${
                    l.id === lesson.id
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-xs font-medium mt-0.5 min-w-[2rem] ${
                      l.id === lesson.id ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      {l.prioritization}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${
                        l.id === lesson.id ? 'text-indigo-900 font-medium' : 'text-gray-700'
                      } line-clamp-2`}>
                        {l.title}
                      </p>
                      {l.requires_subscription && (
                        <span className="inline-block text-xs text-indigo-600 mt-1">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

