'use client';

import { useEffect, useState } from 'react';

export default function TestLessonPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Loom Embed Test</h1>
        <p className="text-gray-600 mb-6">
          This is a test page to verify if Loom embeds work on mobile devices.
        </p>
        
        {/* Try multiple approaches */}
        <div className="space-y-8">
          {/* Approach 1: Original Loom code with aspect-ratio fallback */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Approach 1: Original + aspect-ratio</h2>
            <div 
              style={{ 
                position: 'relative', 
                width: '100%',
                aspectRatio: '16 / 9',
                minHeight: '400px',
                paddingBottom: '62.882096069869%', 
                height: 0 
              }}
            >
              <iframe 
                src="https://www.loom.com/embed/879928c1612844738eea4a77c2aeb68f" 
                frameBorder="0" 
                allowFullScreen
                suppressHydrationWarning
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%',
                  minHeight: '400px'
                }}
              />
            </div>
          </div>

          {/* Approach 2: Fixed height container */}
          {isMounted && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Approach 2: Fixed height (client-only)</h2>
              <div 
                style={{ 
                  position: 'relative', 
                  width: '100%',
                  height: '400px'
                }}
              >
                <iframe 
                  src="https://www.loom.com/embed/879928c1612844738eea4a77c2aeb68f" 
                  frameBorder="0" 
                  allowFullScreen
                  suppressHydrationWarning
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%'
                  }}
                />
              </div>
            </div>
          )}

          {/* Approach 3: Viewport-based height */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Approach 3: Viewport-based</h2>
            <div 
              style={{ 
                position: 'relative', 
                width: '100%',
                height: '56.25vw',
                maxHeight: '80vh',
                minHeight: '300px'
              }}
            >
              <iframe 
                src="https://www.loom.com/embed/879928c1612844738eea4a77c2aeb68f" 
                frameBorder="0" 
                allowFullScreen
                suppressHydrationWarning
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%'
                }}
              />
            </div>
          </div>

          {/* Approach 4: Raw HTML injection (bypasses React) */}
          {isMounted && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Approach 4: Raw HTML (client-only)</h2>
              <div 
                dangerouslySetInnerHTML={{
                  __html: `<div style="position: relative; padding-bottom: 62.882096069869%; height: 0;"><iframe src="https://www.loom.com/embed/879928c1612844738eea4a77c2aeb68f" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>`
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

