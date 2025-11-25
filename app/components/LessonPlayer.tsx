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
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const hasTrackedVideoStart = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setIframeLoaded(false);
    hasTrackedVideoStart.current = false;
  }, [videoUrl]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
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
  };


  // Fallback: Hide loading after timeout if iframe doesn't fire onLoad
  // This is especially important for mobile Safari where onLoad may not fire reliably
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!iframeLoaded) {
        setIsLoading(false);
        // Still try to track if we haven't yet
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
      }
    }, 2000); // 2 second fallback (reduced from 3s for faster UX)

    return () => clearTimeout(fallbackTimer);
  }, [iframeLoaded, videoUrl, lessonId, courseId, lessonTitle, courseTitle]);

  // Construct Loom embed URL
  const loomEmbedUrl = `https://www.loom.com/embed/${videoUrl}`;

  return (
    <div 
      className="relative w-full bg-gray-900" 
      style={{ 
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%', // 16:9 aspect ratio
        height: 0
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading video...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={loomEmbedUrl}
        frameBorder="0"
        allowFullScreen
        onLoad={handleIframeLoad}
        title="Lesson video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
    </div>
  );
};

export default LessonPlayer;

