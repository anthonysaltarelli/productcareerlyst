'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { TrackedLink } from '@/app/components/TrackedLink';

interface Lesson {
  id: string;
  title: string;
  prioritization: string;
  requires_subscription: boolean;
  duration_minutes?: number | null;
  short_description?: string | null;
}

interface ProgressMap {
  [lessonId: string]: boolean;
}

interface LessonNavigatorProps {
  lessons: Lesson[];
  currentLessonId: string;
  courseSlug: string;
  courseId: string;
  initialProgress: ProgressMap;
}

const LessonNavigator = ({ 
  lessons, 
  currentLessonId, 
  courseSlug,
  courseId,
  initialProgress
}: LessonNavigatorProps) => {
  const [progressMap, setProgressMap] = useState<ProgressMap>(initialProgress);

  // Listen for progress updates from the main content area
  useEffect(() => {
    const handleProgressUpdate = (event: CustomEvent) => {
      const { lessonId, completed } = event.detail;
      setProgressMap(prev => ({
        ...prev,
        [lessonId]: completed
      }));
    };

    window.addEventListener('lessonProgressUpdated' as any, handleProgressUpdate);
    
    return () => {
      window.removeEventListener('lessonProgressUpdated' as any, handleProgressUpdate);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h2>
      <div className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {lessons.map((lesson, index) => {
          const isCompleted = progressMap[lesson.id] || false;
          const isCurrentLesson = lesson.id === currentLessonId;

          return (
            <TrackedLink
              key={lesson.id}
              href={`/dashboard/courses/${courseSlug}/lessons/${lesson.id}`}
              linkId={`lesson-navigator-lesson-link-${lesson.id}`}
              eventName="User Clicked Lesson in Sidebar Navigator"
              eventProperties={{
                'Current Lesson ID': currentLessonId,
                'Clicked Lesson ID': lesson.id,
                'Clicked Lesson Title': lesson.title,
                'Clicked Lesson Position': lesson.prioritization,
                'Course ID': courseId,
                'Course Slug': courseSlug,
                'Current Lesson Completed': progressMap[currentLessonId] || false,
                'Clicked Lesson Completed': isCompleted,
                'Clicked Lesson Requires Subscription': lesson.requires_subscription,
                'Navigation Type': 'sidebar_navigator',
                'Link Section': 'Course Content Sidebar',
                'Link Position': index + 1,
              }}
              className={`
                block p-3 rounded-lg transition-colors relative
                ${isCurrentLesson
                  ? 'bg-indigo-50 border border-indigo-200'
                  : 'hover:bg-gray-50 border border-transparent'
                }
              `}
            >
              <div className="flex items-start gap-2">
                <span className={`
                  text-xs font-medium mt-0.5 min-w-[2rem]
                  ${isCurrentLesson ? 'text-indigo-600' : 'text-gray-500'}
                `}>
                  {lesson.prioritization}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`
                    text-sm line-clamp-2 font-medium
                    ${isCurrentLesson ? 'text-indigo-900' : 'text-gray-700'}
                  `}>
                    {lesson.title}
                  </p>
                  {lesson.short_description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {lesson.short_description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {lesson.duration_minutes && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {lesson.duration_minutes} min
                      </span>
                    )}
                    {lesson.requires_subscription && (
                      <span className="text-xs text-indigo-600">
                        Premium
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Complete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </TrackedLink>
          );
        })}
      </div>
    </div>
  );
};

export default LessonNavigator;

