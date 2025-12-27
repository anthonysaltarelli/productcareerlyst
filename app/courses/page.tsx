'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SignUpModal } from '@/app/components/SignUpModal'
import { PageTracking } from '@/app/components/PageTracking'
import { trackEventWithContext } from '@/lib/amplitude/client'
import { TrackedLink } from '@/app/components/TrackedLink'
import { TrackedButton } from '@/app/components/TrackedButton'

interface Lesson {
  id: string
  title: string
  prioritization: string
  requires_subscription: boolean
  short_description: string | null
  duration_minutes: number | null
}

interface Course {
  id: string
  title: string
  slug: string
  description: string
  length: string
  prioritization: number
  lesson_count: number
  lessons?: Lesson[]
}

interface Category {
  id: string
  name: string
  description: string
  slug: string
  display_order: number
  courses: Course[]
}

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
]

const categoryEmojis: Record<string, string> = {
  'career-preparation': '🎯',
  'interview-mastery': '💼',
  'product-fundamentals': '🎓',
  'compensation': '💰'
}

export default function CoursesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState<{ title: string; description: string }>({
    title: 'Create a Free Account',
    description: "Sign up to start watching courses and lessons. It's completely free!"
  })

  useEffect(() => {
    const fetchCourses = async () => {
      const supabase = createClient()
      
      // Get all categories with their courses
      const { data: categoriesData, error } = await supabase
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
        .order('display_order', { ascending: true })

      if (error || !categoriesData) {
        console.error('Error fetching categories:', error)
        setLoading(false)
        return
      }

      // Get lesson counts for each course
      const categoriesWithCounts = await Promise.all(
        categoriesData.map(async (category) => {
          const coursesWithCounts = await Promise.all(
            (category.courses || []).map(async (course: any) => {
              const { count } = await supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', course.id)

              return {
                ...course,
                lesson_count: count || 0
              }
            })
          )

          // Sort courses by prioritization
          coursesWithCounts.sort((a, b) => a.prioritization - b.prioritization)

          return {
            ...category,
            courses: coursesWithCounts
          }
        })
      )

      setCategories(categoriesWithCounts.filter(cat => cat.courses.length > 0))
      setLoading(false)
    }

    fetchCourses()
  }, [])

  const handleCourseClick = async (courseId: string) => {
    // Toggle expansion
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
      
      // Find category and course
      const category = categories.find(cat => 
        cat.courses.some(c => c.id === courseId)
      )
      const course = category?.courses.find(c => c.id === courseId)
      
      // Track course expansion with full context (non-blocking)
      if (course) {
        setTimeout(() => {
          try {
            const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/courses';
            const referrer = typeof window !== 'undefined' ? document.referrer : '';
            // Safely handle invalid referrer URLs
            let referrerDomain: string | null = null;
            if (referrer) {
              try {
                referrerDomain = new URL(referrer).hostname;
              } catch {
                // Invalid referrer URL - ignore silently
                referrerDomain = null;
              }
            }
            const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            
            trackEventWithContext('User Expanded Course', {
              'Page Route': pageRoute,
              'Course ID': courseId,
              'Course Title': course.title,
              'Course Category': category?.name || 'Unknown',
              'Course Slug': course.slug || 'Unknown',
              'Course Description': course.description || 'Unknown',
              'Course Lesson Count': course.lesson_count || 0,
              'Course Length': course.length || 'Unknown',
              'Category Slug': category?.slug || 'Unknown',
              'Referrer URL': referrer || 'None',
              'Referrer Domain': referrerDomain || 'None',
              'UTM Source': urlParams?.get('utm_source') || null,
              'UTM Medium': urlParams?.get('utm_medium') || null,
              'UTM Campaign': urlParams?.get('utm_campaign') || null,
            });
          } catch (error) {
            // Silently fail - analytics should never block UI
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Course expansion tracking error (non-blocking):', error);
            }
          }
        }, 0);
      }
      
      // Fetch lessons if not already loaded
      
      if (course && !course.lessons) {
        const supabase = createClient()
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title, prioritization, requires_subscription, short_description, duration_minutes')
          .eq('course_id', courseId)

        if (lessons) {
          // Sort lessons by prioritization (same logic as dashboard)
          const sortedLessons = lessons.sort((a, b) => {
            const parseSort = (val: string) => {
              const parts = val.split('.');
              return parts.map((p, i) => parseFloat(p) * Math.pow(1000, -i)).reduce((a, b) => a + b, 0);
            };
            return parseSort(a.prioritization) - parseSort(b.prioritization);
          });

          // Update the course with lessons
          setCategories(prev => prev.map(cat => ({
            ...cat,
            courses: cat.courses.map(c => 
              c.id === courseId ? { ...c, lessons: sortedLessons } : c
            )
          })))
        }
      }
    }
    setExpandedCourses(newExpanded)
  }

  const handleLessonClick = (lessonTitle: string, courseTitle?: string, courseId?: string, requiresSubscription?: boolean) => {
    // Show modal immediately - don't wait for tracking
    const isPremium = requiresSubscription === true
    setModalContent({
      title: 'Create a Free Account',
      description: isPremium
        ? `Sign up to watch "${lessonTitle}". This is a premium lesson that requires a subscription.`
        : `Sign up to watch "${lessonTitle}" for free. Create an account to access all our free lessons!`
    })
    setModalOpen(true)
    
    // Track lesson click in background - don't block UI
    setTimeout(() => {
      try {
        const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/courses';
        const referrer = typeof window !== 'undefined' ? document.referrer : '';
        // Safely handle invalid referrer URLs
        let referrerDomain: string | null = null;
        if (referrer) {
          try {
            referrerDomain = new URL(referrer).hostname;
          } catch {
            // Invalid referrer URL - ignore silently
            referrerDomain = null;
          }
        }
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        
        trackEventWithContext('User Clicked Lesson', {
          'Page Route': pageRoute,
          'Lesson Title': lessonTitle,
          'Course Title': courseTitle || 'Unknown',
          'Course ID': courseId || 'Unknown',
          'Click Context': 'Expanded course lessons list',
          'Referrer URL': referrer || 'None',
          'Referrer Domain': referrerDomain || 'None',
          'UTM Source': urlParams?.get('utm_source') || null,
          'UTM Medium': urlParams?.get('utm_medium') || null,
          'UTM Campaign': urlParams?.get('utm_campaign') || null,
        });
      } catch (error) {
        // Silently fail - analytics should never block UI
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Lesson click tracking error (non-blocking):', error);
        }
      }
    }, 0);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-xl font-semibold text-gray-700">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <PageTracking pageName="Courses" />
      <div className="max-w-7xl mx-auto px-4 py-6 md:p-12 lg:p-16">
        {/* Page Header */}
        <div className="mb-12">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_15px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300">
            <span className="text-5xl mb-4 block">📚</span>
            <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
              PM Courses & Lessons
            </h1>
            <p className="text-xl text-gray-700 font-semibold">
              Browse our comprehensive library of product management courses
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
                    const colorScheme = colorSchemes[(categoryIndex * 3 + courseIndex) % colorSchemes.length]
                    const isExpanded = expandedCourses.has(course.id)
                    
                    return (
                      <div key={course.id}>
                        <div
                          className={`p-6 rounded-[2rem] bg-gradient-to-br ${colorScheme.gradient} ${colorScheme.shadow} border-2 ${colorScheme.border} hover:translate-y-1 transition-all duration-200`}
                        >
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
                          <p className="text-gray-700 font-medium text-sm mb-4 line-clamp-2">
                            {course.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm font-bold text-gray-600 mb-4">
                            <span>⏱️ {course.length}</span>
                            <span>📝 {course.lesson_count} lessons</span>
                          </div>

                          <TrackedButton
                            onClick={() => handleCourseClick(course.id)}
                            className="w-full px-6 py-3 rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-gray-300 font-black text-gray-800 transition-all duration-200"
                            eventName="User Clicked View Lessons Button"
                            buttonId="courses-view-lessons-button"
                            eventProperties={{
                              'Button Section': 'Courses Landing Page',
                              'Button Position': 'Course Card',
                              'Button Type': 'Course Action Button',
                              'Button Text': isExpanded ? 'Hide Lessons' : 'View Lessons →',
                              'Button Context': 'Below course description and metadata',
                              'Course ID': course.id,
                              'Course Title': course.title,
                              'Course Category': category.name,
                              'Course Lesson Count': course.lesson_count,
                            }}
                          >
                            {isExpanded ? 'Hide Lessons' : 'View Lessons →'}
                          </TrackedButton>
                        </div>

                        {/* Expanded Lessons List */}
                        {isExpanded && course.lessons && (
                          <div className="mt-4 p-4 rounded-[1.5rem] bg-white/60 backdrop-blur-sm border-2 border-gray-200">
                            <h4 className="text-lg font-bold text-gray-800 mb-3">Lessons</h4>
                            <div className="space-y-2">
                              {course.lessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  onClick={() => handleLessonClick(lesson.title, course.title, course.id, lesson.requires_subscription)}
                                  className="p-3 rounded-[1rem] bg-white/80 hover:bg-white border-2 border-gray-200 cursor-pointer transition-all duration-200"
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`${lesson.prioritization}. ${lesson.title}${lesson.requires_subscription ? ' (Premium)' : ''}`}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      handleLessonClick(lesson.title, course.title, course.id, lesson.requires_subscription)
                                    }
                                  }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="text-gray-900 font-semibold">
                                      {lesson.prioritization}. {lesson.title}
                                    </span>
                                    {lesson.short_description && (
                                      <p className="text-gray-600 text-sm mt-1">
                                        {lesson.short_description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      {lesson.requires_subscription && (
                                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-bold">
                                          Premium
                                        </span>
                                      )}
                                      {lesson.duration_minutes && (
                                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {lesson.duration_minutes} min
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-[2rem] p-8 text-center">
            <span className="text-6xl mb-4 block">🗄️</span>
            <h2 className="text-2xl font-black text-gray-800 mb-4">No Courses Available</h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Courses are being set up. Please check back soon!
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_15px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800 text-center">
          <p className="text-2xl font-black text-white mb-2">
            🚀 Ready to Start Learning?
          </p>
          <p className="text-gray-400 font-medium mb-6">
            Create a free account to access free lessons and preview premium content
          </p>
          <TrackedButton
            href="/auth/sign-up"
            className="inline-block px-12 py-4 rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_10px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)] text-xl font-black text-white transition-all duration-200"
            eventName="User Clicked Sign Up Button"
            buttonId="courses-page-bottom-cta"
            eventProperties={{
              'Button Section': 'Courses Landing Page CTA Section',
              'Button Position': 'Bottom of page after all courses',
              'Button Type': 'Courses CTA',
              'Button Text': 'Sign Up for Free →',
              'Button Context': 'After browsing all courses and categories',
              'Page Section': 'Bottom of page',
              'CTA Theme': 'Dark slate background with purple gradient button',
            }}
          >
            Sign Up for Free →
          </TrackedButton>
        </div>
      </div>

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        description={modalContent.description}
      />
    </div>
  )
}

