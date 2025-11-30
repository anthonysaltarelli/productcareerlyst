import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CoursePageTracking } from '@/app/components/CoursePageTracking';
import { TrackedLink } from '@/app/components/TrackedLink';

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
  category_id: string | null;
  categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
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
      category_id,
      categories (
        id,
        name,
        slug
      ),
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

  // Handle categories - Supabase returns array but we expect single object or null
  const categories = Array.isArray(course.categories) 
    ? (course.categories.length > 0 ? course.categories[0] : null)
    : (course.categories || null);

  return {
    ...course,
    categories,
    lessons: sortedLessons
  };
};

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseWithLessons(slug);

  if (!course) {
    redirect('/dashboard/courses');
  }

  // Calculate lesson counts
  const premiumLessonsCount = course.lessons.filter(l => l.requires_subscription).length;
  const freeLessonsCount = course.lessons.length - premiumLessonsCount;
  const category = Array.isArray(course.categories) ? course.categories[0] : course.categories;

  // Get the first lesson to redirect to
  const firstLesson = course.lessons[0];

  if (firstLesson) {
    // Track course page view before redirect
    // Note: The lesson page will also track, which is fine - we get both events
    redirect(`/dashboard/courses/${slug}/lessons/${firstLesson.id}`);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <CoursePageTracking
        courseId={course.id}
        courseTitle={course.title}
        courseSlug={slug}
        courseCategory={category?.name || 'Unknown'}
        courseDescription={course.description || ''}
        courseLength={course.length || ''}
        totalLessons={course.lessons.length}
        premiumLessonsCount={premiumLessonsCount}
        freeLessonsCount={freeLessonsCount}
      />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
        <p className="text-gray-600 mb-6">{course.description}</p>
        <p className="text-sm text-gray-500 mb-8">Duration: {course.length}</p>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lessons</h2>
          {course.lessons.length > 0 ? (
            course.lessons.map((lesson, index) => (
              <TrackedLink
                key={lesson.id}
                href={`/dashboard/courses/${slug}/lessons/${lesson.id}`}
                linkId={`course-page-lesson-link-${lesson.id}`}
                eventName="User Clicked Lesson Link"
                eventProperties={{
                  'Lesson ID': lesson.id,
                  'Lesson Title': lesson.title,
                  'Lesson Position': lesson.prioritization,
                  'Lesson Requires Subscription': lesson.requires_subscription,
                  'Course ID': course.id,
                  'Course Title': course.title,
                  'Course Slug': slug,
                  'Link Position': index + 1,
                  'Link Section': 'Course Page',
                  'Link Type': 'Lesson Link',
                }}
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
              </TrackedLink>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No lessons available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

