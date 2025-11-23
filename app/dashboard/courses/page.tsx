import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CoursesPageTracking } from '@/app/components/CoursesPageTracking';
import { TrackedLink } from '@/app/components/TrackedLink';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  length: string;
  prioritization: number;
  lesson_count: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  display_order: number;
  courses: Course[];
}

const getCoursesWithCategories = async (): Promise<Category[]> => {
  const supabase = await createClient();
  
  // Get all categories with their courses
  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      description,
      slug,
      display_order,
      courses (
        id,
        title,
        slug,
        description,
        length,
        prioritization
      )
    `)
    .order('display_order', { ascending: true });

  if (error || !categories) {
    return [];
  }

  // Get lesson counts for each course
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const coursesWithCounts = await Promise.all(
        (category.courses || []).map(async (course: any) => {
          const { count } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          return {
            ...course,
            lesson_count: count || 0
          };
        })
      );

      // Sort courses by prioritization
      coursesWithCounts.sort((a, b) => a.prioritization - b.prioritization);

      return {
        ...category,
        courses: coursesWithCounts
      };
    })
  );

  return categoriesWithCounts.filter(cat => cat.courses.length > 0);
};

const colorSchemes = [
  {
    gradient: 'from-blue-200 to-cyan-200',
    border: 'border-blue-300',
    shadow: 'shadow-[0_10px_0_0_rgba(37,99,235,0.3)] hover:shadow-[0_6px_0_0_rgba(37,99,235,0.3)]'
  },
  {
    gradient: 'from-purple-200 to-pink-200',
    border: 'border-purple-300',
    shadow: 'shadow-[0_10px_0_0_rgba(147,51,234,0.3)] hover:shadow-[0_6px_0_0_rgba(147,51,234,0.3)]'
  },
  {
    gradient: 'from-green-200 to-emerald-200',
    border: 'border-green-300',
    shadow: 'shadow-[0_10px_0_0_rgba(22,163,74,0.3)] hover:shadow-[0_6px_0_0_rgba(22,163,74,0.3)]'
  },
  {
    gradient: 'from-orange-200 to-yellow-200',
    border: 'border-orange-300',
    shadow: 'shadow-[0_10px_0_0_rgba(234,88,12,0.3)] hover:shadow-[0_6px_0_0_rgba(234,88,12,0.3)]'
  },
  {
    gradient: 'from-violet-200 to-purple-200',
    border: 'border-violet-300',
    shadow: 'shadow-[0_10px_0_0_rgba(124,58,237,0.3)] hover:shadow-[0_6px_0_0_rgba(124,58,237,0.3)]'
  },
  {
    gradient: 'from-pink-200 to-rose-200',
    border: 'border-pink-300',
    shadow: 'shadow-[0_10px_0_0_rgba(236,72,153,0.3)] hover:shadow-[0_6px_0_0_rgba(236,72,153,0.3)]'
  },
  {
    gradient: 'from-teal-200 to-cyan-200',
    border: 'border-teal-300',
    shadow: 'shadow-[0_10px_0_0_rgba(20,184,166,0.3)] hover:shadow-[0_6px_0_0_rgba(20,184,166,0.3)]'
  }
];

const categoryEmojis: Record<string, string> = {
  'career-preparation': '🎯',
  'interview-mastery': '💼',
  'product-fundamentals': '🎓',
  'compensation': '💰'
};

export default async function CoursesPage() {
  const categories = await getCoursesWithCategories();
  const totalCategories = categories.length;
  const totalCourses = categories.reduce((sum, cat) => sum + cat.courses.length, 0);

  return (
    <div className="p-8 md:p-12">
      <CoursesPageTracking 
        totalCategories={totalCategories}
        totalCourses={totalCourses}
      />
      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_15px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300">
          <span className="text-5xl mb-4 block">📚</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            PM Courses
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Structured learning paths to master product management
          </p>
        </div>
      </div>

      {/* Course Categories */}
      {categories.length > 0 ? (
      <div className="space-y-8">
          {categories.map((category, categoryIndex) => (
            <div key={category.id}>
          <h2 className="text-2xl font-black text-gray-800 mb-4">
                {categoryEmojis[category.slug] || '📖'} {category.name}
          </h2>
              {category.description && (
                <p className="text-gray-600 font-medium mb-4">{category.description}</p>
              )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {category.courses.map((course, courseIndex) => {
                  const colorScheme = colorSchemes[(categoryIndex * 3 + courseIndex) % colorSchemes.length];
                  return (
            <CourseCard
                      key={course.id}
                      course={course}
                      colorScheme={colorScheme}
                      categoryName={category.name}
                      categoryIndex={categoryIndex}
                      courseIndex={courseIndex}
                    />
                  );
                })}
              </div>
          </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-[2rem] p-8 text-center">
          <span className="text-6xl mb-4 block">🗄️</span>
          <h2 className="text-2xl font-black text-gray-800 mb-4">Database Setup Required</h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            No courses found. You need to create the database tables and seed the course data.
          </p>
          <div className="bg-white border border-yellow-300 rounded-lg p-6 max-w-2xl mx-auto text-left mb-6">
            <h3 className="font-bold text-lg mb-3">Quick Setup:</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li className="font-medium">
                Open your Supabase SQL Editor
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Go to: Dashboard → SQL Editor
                </p>
              </li>
              <li className="font-medium">
                Run the schema SQL
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Copy and paste contents from <code className="bg-yellow-100 px-2 py-1 rounded font-mono text-xs">database/schema.sql</code>
                </p>
              </li>
              <li className="font-medium">
                Run the seed data SQL
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Copy and paste contents from <code className="bg-yellow-100 px-2 py-1 rounded font-mono text-xs">database/seed_data.sql</code>
                </p>
              </li>
              <li className="font-medium">
                Refresh this page
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  You should see 7 courses with 120+ lessons!
                </p>
              </li>
            </ol>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 max-w-2xl mx-auto text-sm text-gray-700">
            <p>
              📖 See <code className="bg-indigo-100 px-2 py-1 rounded font-mono text-xs">LEARNING_PLATFORM_SETUP.md</code> for detailed instructions
            </p>
          </div>
        </div>
      )}

      {/* Coming Soon Banner */}
      <div className="mt-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800 text-center">
        <p className="text-2xl font-black text-white mb-2">
          🚀 More courses launching soon!
        </p>
        <p className="text-gray-400 font-medium">
          We're constantly adding new content. Check back regularly for updates.
        </p>
      </div>
    </div>
  );
}

const CourseCard = ({
  course,
  colorScheme,
  categoryName,
  categoryIndex,
  courseIndex
}: {
  course: Course;
  colorScheme: {
    gradient: string;
    border: string;
    shadow: string;
  };
  categoryName: string;
  categoryIndex: number;
  courseIndex: number;
}) => {
  return (
    <TrackedLink
      href={`/dashboard/courses/${course.slug}`}
      linkId={`dashboard-courses-course-card-${course.slug}`}
      eventName="User Clicked Course Card"
      eventProperties={{
        'Course ID': course.id,
        'Course Title': course.title,
        'Course Slug': course.slug,
        'Course Category': categoryName,
        'Course Lesson Count': course.lesson_count,
        'Course Length': course.length,
        'Course Position in Category': courseIndex + 1,
        'Category Position': categoryIndex + 1,
        'Link Section': 'Dashboard Courses Page',
        'Link Position': `Course Card ${courseIndex + 1} in ${categoryName}`,
        'Link Type': 'Course Card',
        'Link Text': 'Start Course →',
      }}
      className={`p-6 rounded-[2rem] bg-gradient-to-br ${colorScheme.gradient} ${colorScheme.shadow} border-2 ${colorScheme.border} hover:translate-y-1 transition-all duration-200 cursor-pointer h-full block`}
    >
      <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
      <p className="text-gray-700 font-medium text-sm mb-4 line-clamp-2">
        {course.description}
      </p>

      <div className="flex items-center gap-4 text-sm font-bold text-gray-600 mb-4">
        <span>⏱️ {course.length}</span>
        <span>📝 {course.lesson_count} lessons</span>
      </div>

      <div className="w-full px-6 py-3 rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-gray-300 font-black text-gray-800 transition-all duration-200 text-center">
        Start Course →
      </div>
    </TrackedLink>
  );
};
