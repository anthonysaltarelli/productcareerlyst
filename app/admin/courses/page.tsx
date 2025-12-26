import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Video, FileText, ChevronRight } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  video_url: string | null
  prioritization: string
  requires_subscription: boolean
  duration_minutes: number | null
  short_description: string | null
  content: { type: string; content?: unknown[] } | null
}

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  is_published: boolean
  prioritization: number
  lessons: Lesson[]
  categories: {
    id: string
    name: string
    slug: string
  } | null
}

interface CategoryGroup {
  category: { id: string; name: string; slug: string } | null
  courses: Course[]
}

export default async function AdminCoursesPage() {
  const supabase = await createClient()

  // Fetch all courses with their lessons and categories
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      is_published,
      prioritization,
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
        requires_subscription,
        duration_minutes,
        short_description,
        content
      )
    `)
    .order('prioritization', { ascending: true })

  if (error) {
    console.error('Error fetching courses:', error)
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load courses. Please try again.
        </div>
      </div>
    )
  }

  // Group courses by category
  const categoryGroups: CategoryGroup[] = []
  const uncategorizedCourses: Course[] = []

  const courseData = (courses || []) as unknown as Course[]

  courseData.forEach((course) => {
    const category = Array.isArray(course.categories)
      ? course.categories[0]
      : course.categories

    // Sort lessons by prioritization
    course.lessons = (course.lessons || []).sort((a, b) => {
      const parseSort = (val: string) => {
        const parts = val.split('.')
        return parts.map((p, i) => parseFloat(p) * Math.pow(1000, -i)).reduce((acc, v) => acc + v, 0)
      }
      return parseSort(a.prioritization) - parseSort(b.prioritization)
    })

    if (!category) {
      uncategorizedCourses.push(course)
    } else {
      const existingGroup = categoryGroups.find((g) => g.category?.id === category.id)
      if (existingGroup) {
        existingGroup.courses.push(course)
      } else {
        categoryGroups.push({
          category,
          courses: [course]
        })
      }
    }
  })

  // Add uncategorized at the end if any
  if (uncategorizedCourses.length > 0) {
    categoryGroups.push({
      category: null,
      courses: uncategorizedCourses
    })
  }

  // Helper to check if lesson has content
  const hasContent = (lesson: Lesson): boolean => {
    return (
      lesson.content !== null &&
      typeof lesson.content === 'object' &&
      lesson.content.type === 'doc' &&
      Array.isArray(lesson.content.content) &&
      lesson.content.content.length > 0
    )
  }

  // Count stats
  const totalCourses = courseData.length
  const totalLessons = courseData.reduce((acc, c) => acc + c.lessons.length, 0)
  const lessonsWithContent = courseData.reduce(
    (acc, c) => acc + c.lessons.filter(hasContent).length,
    0
  )
  const lessonsWithVideo = courseData.reduce(
    (acc, c) => acc + c.lessons.filter((l) => l.video_url).length,
    0
  )

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Content Management</h1>
        <p className="text-gray-600">
          Add and edit written content for course lessons. Click on a lesson to edit its content.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{totalCourses}</div>
          <div className="text-sm text-gray-500">Courses</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{totalLessons}</div>
          <div className="text-sm text-gray-500">Total Lessons</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-indigo-600">{lessonsWithVideo}</div>
          <div className="text-sm text-gray-500">With Video</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{lessonsWithContent}</div>
          <div className="text-sm text-gray-500">With Written Content</div>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-8">
        {categoryGroups.map((group) => (
          <div key={group.category?.id || 'uncategorized'}>
            {/* Category Header */}
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              {group.category?.name || 'Uncategorized'}
            </h2>

            {/* Courses in this category */}
            <div className="space-y-4">
              {group.courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Course Header */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500">
                          {course.lessons.length} lessons
                          {!course.is_published && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              Draft
                            </span>
                          )}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/courses/${course.slug}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        target="_blank"
                      >
                        View Course
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Lessons List */}
                  <div className="divide-y divide-gray-100">
                    {course.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/admin/courses/${course.slug}/lessons/${lesson.id}`}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm text-gray-400 font-mono w-8 flex-shrink-0">
                            {lesson.prioritization}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate group-hover:text-indigo-600">
                              {lesson.title}
                            </div>
                            <div className="text-xs text-gray-400 font-mono truncate">
                              {lesson.id}
                            </div>
                            {lesson.short_description && (
                              <div className="text-sm text-gray-500 truncate max-w-md">
                                {lesson.short_description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Indicators */}
                          <div className="flex items-center gap-2">
                            {lesson.video_url ? (
                              <span
                                className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"
                                title="Has video"
                              >
                                <Video className="w-3 h-3" />
                                Video
                              </span>
                            ) : (
                              <span
                                className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full"
                                title="No video"
                              >
                                <Video className="w-3 h-3" />
                                No Video
                              </span>
                            )}
                            {hasContent(lesson) ? (
                              <span
                                className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                                title="Has written content"
                              >
                                <FileText className="w-3 h-3" />
                                Content
                              </span>
                            ) : (
                              <span
                                className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full"
                                title="No written content"
                              >
                                <FileText className="w-3 h-3" />
                                No Content
                              </span>
                            )}
                            {lesson.requires_subscription && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                Premium
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
