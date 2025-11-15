'use client';

import { Toaster } from 'sonner';
import LessonCompletionButton from './LessonCompletionButton';

interface LessonContentWrapperProps {
  lessonId: string;
  isCompleted: boolean;
}

const LessonContentWrapper = ({ lessonId, isCompleted }: LessonContentWrapperProps) => {
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
        initialCompleted={isCompleted}
        onToggle={handleToggle}
      />
    </>
  );
};

export default LessonContentWrapper;

