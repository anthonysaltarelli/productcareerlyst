import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

interface Lesson {
  id: string;
  title: string;
  video_url: string;
  prioritization: string;
  requires_subscription: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  length: string;
  lessons: Lesson[];
}

const getCourseWithLessons = async (slug: string): Promise<Course | null> => {
  const supabase = await createClient();
  
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      description,
      length,
      lessons (
        id,
        title,
        video_url,
        prioritization,
        requires_subscription
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return null;
  }

  if (!course) {
    return null;
  }

  // Sort lessons by prioritization
  const lessons = course.lessons as Lesson[] || [];
  const sortedLessons = lessons.sort((a, b) => {
    const parseSort = (val: string) => {
      const parts = val.split('.');
      return parts.map((p, i) => parseFloat(p) * Math.pow(1000, -i)).reduce((a, b) => a + b, 0);
    };
    return parseSort(a.prioritization) - parseSort(b.prioritization);
  });

  return {
    ...course,
    lessons: sortedLessons
  };
};

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await getCourseWithLessons(params.slug);

  if (!course) {
    // Return a helpful error page instead of 404
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-700 mb-6">
            Looking for course: <code className="bg-yellow-100 px-2 py-1 rounded font-mono text-sm">{params.slug}</code>
          </p>
          <div className="bg-white border border-yellow-300 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-bold text-lg mb-3">Possible reasons:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Database tables haven't been created yet</li>
              <li>Course data hasn't been seeded</li>
              <li>Course slug is incorrect</li>
              <li>Course is not published</li>
            </ol>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-left">
            <h2 className="font-bold text-lg mb-3">To fix this:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
              <li>Open Supabase SQL Editor</li>
              <li>Run the SQL from <code className="bg-indigo-100 px-2 py-1 rounded font-mono text-xs">database/schema.sql</code></li>
              <li>Then run <code className="bg-indigo-100 px-2 py-1 rounded font-mono text-xs">database/seed_data.sql</code></li>
            </ol>
            <p className="text-sm text-gray-600">
              See <code className="bg-indigo-100 px-2 py-1 rounded font-mono text-xs">LEARNING_PLATFORM_SETUP.md</code> for detailed instructions.
            </p>
          </div>
          <Link
            href="/dashboard/courses"
            className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  // Get the first lesson to redirect to
  const firstLesson = course.lessons[0];

  if (firstLesson) {
    redirect(`/dashboard/courses/${params.slug}/lessons/${firstLesson.id}`);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
        <p className="text-gray-600 mb-6">{course.description}</p>
        <p className="text-sm text-gray-500 mb-8">Duration: {course.length}</p>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lessons</h2>
          {course.lessons.length > 0 ? (
            course.lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/dashboard/courses/${params.slug}/lessons/${lesson.id}`}
                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 min-w-[3rem]">
                      {lesson.prioritization}
                    </span>
                    <span className="text-gray-900">{lesson.title}</span>
                  </div>
                  {lesson.requires_subscription && (
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                      Premium
                    </span>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No lessons available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

