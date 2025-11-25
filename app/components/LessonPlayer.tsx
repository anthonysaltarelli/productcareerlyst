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
    // Detect if we're on mobile - use longer timeout for mobile devices
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const timeoutDuration = isMobile ? 4000 : 2000; // 4 seconds for mobile, 2 for desktop

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
    }, timeoutDuration);

    return () => clearTimeout(fallbackTimer);
  }, [iframeLoaded, videoUrl, lessonId, courseId, lessonTitle, courseTitle]);

  // Intersection Observer fallback for mobile Safari
  // Detects when iframe becomes visible and helps with loading state
  useEffect(() => {
    if (!iframeRef.current) return;

    let visibilityTimer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If iframe is visible and we haven't detected load yet, hide loading after delay
          if (entry.isIntersecting && !iframeLoaded) {
            // Clear any existing timer
            if (visibilityTimer) {
              clearTimeout(visibilityTimer);
            }
            // Give it a moment to actually load, then hide loading state
            visibilityTimer = setTimeout(() => {
              if (!iframeLoaded) {
                setIsLoading(false);
              }
            }, 1500); // 1.5 seconds after becoming visible
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of iframe is visible
    );

    observer.observe(iframeRef.current);

    return () => {
      observer.disconnect();
      if (visibilityTimer) {
        clearTimeout(visibilityTimer);
      }
    };
  }, [iframeLoaded, videoUrl]);

  // Construct Loom embed URL
  const loomEmbedUrl = `https://www.loom.com/embed/${videoUrl}`;

  return (
    <div 
      className="relative w-full bg-gray-900" 
      style={{ 
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        minHeight: '315px' // Fallback for older browsers that don't support aspect-ratio
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
        loading="eager"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        suppressHydrationWarning
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

