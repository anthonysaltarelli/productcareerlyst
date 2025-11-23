'use client';

import { useEffect, useState, useRef } from 'react';
import { trackEventWithLessonContext } from '@/lib/amplitude/client';

interface LessonPlayerProps {
  videoUrl: string;
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  courseTitle: string;
}

const LessonPlayer = ({ 
  videoUrl, 
  lessonId, 
  courseId, 
  lessonTitle, 
  courseTitle 
}: LessonPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const hasTrackedVideoStart = useRef(false);

  useEffect(() => {
    setIsLoading(true);
    hasTrackedVideoStart.current = false;
    // Reset loading state when video changes
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Track video started when iframe loads
      // Note: Loom embed doesn't expose JavaScript API for video events (play, pause, complete)
      // due to iframe sandboxing. We can only track when the video player loads.
      if (!hasTrackedVideoStart.current) {
        hasTrackedVideoStart.current = true;
        setTimeout(() => {
          try {
            trackEventWithLessonContext('User Started Lesson Video', lessonId, courseId, {
              'Lesson ID': lessonId,
              'Lesson Title': lessonTitle,
              'Course ID': courseId,
              'Course Title': courseTitle,
              'Video Provider': 'loom',
              'Video URL': videoUrl,
            });
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Video tracking error (non-blocking):', error);
            }
          }
        }, 0);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [videoUrl, lessonId, courseId, lessonTitle, courseTitle]);

  // Construct Loom embed URL
  const loomEmbedUrl = `https://www.loom.com/embed/${videoUrl}`;

  return (
    <div className="relative w-full bg-gray-900" style={{ aspectRatio: '16/9' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading video...</p>
          </div>
        </div>
      )}
      <iframe
        src={loomEmbedUrl}
        frameBorder="0"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
        title="Lesson video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
};

export default LessonPlayer;

