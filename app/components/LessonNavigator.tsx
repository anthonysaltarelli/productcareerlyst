'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Lesson {
  id: string;
  title: string;
  prioritization: string;
  requires_subscription: boolean;
}

interface ProgressMap {
  [lessonId: string]: boolean;
}

interface LessonNavigatorProps {
  lessons: Lesson[];
  currentLessonId: string;
  courseSlug: string;
  initialProgress: ProgressMap;
}

const LessonNavigator = ({ 
  lessons, 
  currentLessonId, 
  courseSlug,
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
        {lessons.map((lesson) => {
          const isCompleted = progressMap[lesson.id] || false;
          const isCurrentLesson = lesson.id === currentLessonId;

          return (
            <Link
              key={lesson.id}
              href={`/dashboard/courses/${courseSlug}/lessons/${lesson.id}`}
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
                    text-sm line-clamp-2
                    ${isCurrentLesson ? 'text-indigo-900 font-medium' : 'text-gray-700'}
                  `}>
                    {lesson.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
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
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default LessonNavigator;

