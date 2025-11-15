'use client';

import { useEffect, useState } from 'react';

interface LessonPlayerProps {
  videoUrl: string;
  lessonId: string;
}

const LessonPlayer = ({ videoUrl, lessonId }: LessonPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Reset loading state when video changes
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [videoUrl]);

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

