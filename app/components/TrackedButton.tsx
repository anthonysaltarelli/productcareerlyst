'use client';

import { trackEvent } from '@/lib/amplitude/client';

interface TrackedButtonProps {
  children: React.ReactNode;
  className?: string;
  eventName: string;
  eventProperties?: Record<string, any>;
  href?: string;
  onClick?: () => void;
  buttonId?: string; // Unique identifier for this specific button instance
}

/**
 * Button component that tracks clicks with Amplitude
 * Captures exact click location and context
 */
export const TrackedButton = ({
  children,
  className,
  eventName,
  eventProperties = {},
  href,
  onClick,
  buttonId,
}: TrackedButtonProps) => {
  const handleClick = (e: React.MouseEvent) => {
    // Call onClick immediately - don't wait for tracking
    if (onClick) {
      onClick();
    }
    
    // Fire tracking in the background - don't block the click handler
    // Use setTimeout to ensure it doesn't block the click handler
    setTimeout(() => {
      try {
        const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
        const pageName = pageRoute === '/' ? 'Homepage' : pageRoute.split('/').filter(Boolean).join(' - ') || 'Unknown';
        
        // Get referrer information (safely handle invalid URLs)
        const referrer = typeof window !== 'undefined' ? document.referrer : '';
        let referrerDomain: string | null = null;
        if (referrer) {
          try {
            referrerDomain = new URL(referrer).hostname;
          } catch {
            // Invalid referrer URL - ignore silently
            referrerDomain = null;
          }
        }
        
        // Get UTM parameters
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        
        // Get click position relative to viewport
        const clickX = e.clientX;
        const clickY = e.clientY;
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
        
        // Determine if click is in top/bottom/left/right of viewport
        const clickPosition = {
          horizontal: clickX < viewportWidth / 3 ? 'Left' : clickX > (viewportWidth * 2 / 3) ? 'Right' : 'Center',
          vertical: clickY < viewportHeight / 3 ? 'Top' : clickY > (viewportHeight * 2 / 3) ? 'Bottom' : 'Middle',
        };
        
        trackEvent(eventName, {
          ...eventProperties,
          'Page Route': pageRoute,
          'Page Name': pageName,
          'Button URL': href || 'N/A',
          'Button ID': buttonId || 'Not Specified',
          'Referrer URL': referrer || 'None',
          'Referrer Domain': referrerDomain || 'None',
          'UTM Source': urlParams?.get('utm_source') || null,
          'UTM Medium': urlParams?.get('utm_medium') || null,
          'UTM Campaign': urlParams?.get('utm_campaign') || null,
          'Click Position X': clickX,
          'Click Position Y': clickY,
          'Click Position Horizontal': clickPosition.horizontal,
          'Click Position Vertical': clickPosition.vertical,
          'Viewport Width': viewportWidth,
          'Viewport Height': viewportHeight,
        });
      } catch (error) {
        // Silently fail - analytics should never block clicks
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Button tracking error (non-blocking):', error);
        }
      }
    }, 0);
  };

  if (href) {
    return (
      <a
        href={href}
        className={className}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

