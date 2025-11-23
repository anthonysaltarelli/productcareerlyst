'use client';

import { Toaster } from 'sonner';
import LessonCompletionButton from './LessonCompletionButton';

interface LessonContentWrapperProps {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  courseTitle: string;
  isCompleted: boolean;
}

const LessonContentWrapper = ({ 
  lessonId, 
  courseId,
  lessonTitle,
  courseTitle,
  isCompleted 
}: LessonContentWrapperProps) => {
  const handleToggle = (completed: boolean) => {
    // Dispatch custom event to update the navigator
    const event = new CustomEvent('lessonProgressUpdated', {
      detail: { lessonId, completed }
    });
    window.dispatchEvent(event);
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <LessonCompletionButton 
        lessonId={lessonId}
        courseId={courseId}
        lessonTitle={lessonTitle}
        courseTitle={courseTitle}
        initialCompleted={isCompleted}
        onToggle={handleToggle}
      />
    </>
  );
};

export default LessonContentWrapper;

