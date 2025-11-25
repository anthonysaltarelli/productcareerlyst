'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { trackEventWithLessonContext } from '@/lib/amplitude/client';

interface LessonCompletionButtonProps {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  courseTitle: string;
  initialCompleted: boolean;
  onToggle?: (completed: boolean) => void;
}

const LessonCompletionButton = ({ 
  lessonId,
  courseId,
  lessonTitle,
  courseTitle,
  initialCompleted,
  onToggle 
}: LessonCompletionButtonProps) => {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleComplete = async () => {
    setIsLoading(true);
    const newCompletedState = !isCompleted;
    const currentStatus = isCompleted ? 'completed' : 'incomplete';
    const newStatus = newCompletedState ? 'completed' : 'incomplete';
    const action = newCompletedState ? 'mark_complete' : 'mark_incomplete';

    // Track button click immediately (non-blocking)
    setTimeout(() => {
      try {
        trackEventWithLessonContext('User Clicked Mark Lesson Complete Button', lessonId, courseId, {
          'Button ID': 'lesson-page-mark-complete-button',
          'Lesson ID': lessonId,
          'Lesson Title': lessonTitle,
          'Course ID': courseId,
          'Current Completion Status': currentStatus,
          'New Completion Status': newStatus,
          'Action': action,
          'Is First Completion': !initialCompleted && newCompletedState,
          'Button Section': 'Lesson Navigation Bar',
          'Button Position': 'Center of Navigation Bar',
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Tracking error (non-blocking):', error);
        }
      }
    }, 0);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: newCompletedState }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lesson progress');
      }

      setIsCompleted(newCompletedState);
      
      if (newCompletedState) {
        toast.success('Lesson marked as complete! 🎉');
        
        // Track completion event
        setTimeout(() => {
          try {
            trackEventWithLessonContext('User Marked Lesson Complete', lessonId, courseId, {
              'Lesson ID': lessonId,
              'Lesson Title': lessonTitle,
              'Course ID': courseId,
              'Course Title': courseTitle,
              'Is First Completion': !initialCompleted,
              'Completion Method': 'manual_mark',
            });
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Tracking error (non-blocking):', error);
            }
          }
        }, 0);
      } else {
        toast.info('Lesson marked as incomplete');
        
        // Track incomplete event
        setTimeout(() => {
          try {
            trackEventWithLessonContext('User Marked Lesson Incomplete', lessonId, courseId, {
              'Lesson ID': lessonId,
              'Lesson Title': lessonTitle,
              'Course ID': courseId,
            });
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Tracking error (non-blocking):', error);
            }
          }
        }, 0);
      }

      if (onToggle) {
        onToggle(newCompletedState);
      }
    } catch (error) {
      console.error('Error toggling lesson completion:', error);
      toast.error('Failed to update lesson progress');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleComplete}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-2 w-full md:w-auto px-4 py-3 md:py-2 rounded-lg text-sm font-medium transition-all
        ${isCompleted 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Updating...</span>
        </>
      ) : isCompleted ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Completed</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Mark as Complete</span>
        </>
      )}
    </button>
  );
};

export default LessonCompletionButton;

