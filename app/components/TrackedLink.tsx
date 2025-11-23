'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/amplitude/client';

interface TrackedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  eventName: string;
  eventProperties?: Record<string, any>;
  linkId?: string; // Unique identifier for this specific link instance
  target?: string;
  rel?: string;
  tabIndex?: number;
  ariaLabel?: string;
}

/**
 * Link component that tracks clicks with Amplitude
 * Captures exact click location and context
 */
export const TrackedLink = ({
  href,
  children,
  className,
  eventName,
  eventProperties = {},
  linkId,
  target,
  rel,
  tabIndex,
  ariaLabel,
}: TrackedLinkProps) => {
  const handleClick = (e: React.MouseEvent) => {
    // Fire tracking in the background - don't block navigation
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
          'Link URL': href,
          'Link Destination': href,
          'Link ID': linkId || 'Not Specified',
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
        // Silently fail - analytics should never block navigation
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Link tracking error (non-blocking):', error);
        }
      }
    }, 0);
  };

  // For external links, use regular anchor tag
  const isExternal = href.startsWith('http') || href.startsWith('mailto:')
  
  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        onClick={handleClick}
        target={target}
        rel={rel}
        tabIndex={tabIndex}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
};

