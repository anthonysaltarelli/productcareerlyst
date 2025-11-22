'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/amplitude/client';

interface PageTrackingProps {
  pageName: string;
}

/**
 * Component to track page views
 * Uses a ref to prevent duplicate tracking in React StrictMode
 */
export const PageTracking = ({ pageName }: PageTrackingProps) => {
  const trackedPageName = useRef<string | null>(null);

  useEffect(() => {
    // Prevent duplicate tracking (React StrictMode runs effects twice in dev)
    // But allow tracking if pageName changes (user navigated to different page)
    if (trackedPageName.current === pageName) {
      return;
    }
    trackedPageName.current = pageName;

    // Get current URL and referrer information
    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    const referrerUrl = referrer ? new URL(referrer) : null;
    const referrerDomain = referrerUrl ? referrerUrl.hostname : null;
    
    // Check if referrer is from same domain (internal navigation)
    const isInternalReferrer = referrerDomain && typeof window !== 'undefined' 
      ? referrerDomain === window.location.hostname 
      : false;
    
    // Get UTM parameters from URL
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const utmSource = urlParams?.get('utm_source') || null;
    const utmMedium = urlParams?.get('utm_medium') || null;
    const utmCampaign = urlParams?.get('utm_campaign') || null;
    const utmTerm = urlParams?.get('utm_term') || null;
    const utmContent = urlParams?.get('utm_content') || null;
    
    // Determine traffic source
    let trafficSource = 'Direct';
    if (utmSource) {
      trafficSource = `UTM: ${utmSource}`;
    } else if (isInternalReferrer) {
      trafficSource = 'Internal';
    } else if (referrerDomain) {
      // Check if it's a known referrer
      if (referrerDomain.includes('google')) {
        trafficSource = 'Google';
      } else if (referrerDomain.includes('facebook') || referrerDomain.includes('fb')) {
        trafficSource = 'Facebook';
      } else if (referrerDomain.includes('twitter') || referrerDomain.includes('x.com')) {
        trafficSource = 'Twitter';
      } else if (referrerDomain.includes('linkedin')) {
        trafficSource = 'LinkedIn';
      } else if (referrerDomain.includes('youtube')) {
        trafficSource = 'YouTube';
      } else {
        trafficSource = `Referral: ${referrerDomain}`;
      }
    }
    
    // Map page names to specific event names
    const eventNameMap: Record<string, string> = {
      'Courses': 'User Viewed Courses Landing Page',
      'Sign Up': 'User Viewed Sign Up Page',
      'Login': 'User Viewed Login Page',
    };
    
    const eventName = eventNameMap[pageName] || `User Viewed ${pageName} Page`;
    
    trackEvent(eventName, {
      'Page Route': pageRoute,
      'Page Name': pageName,
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
      'Traffic Source': trafficSource,
      'Is Internal Referrer': isInternalReferrer,
      'UTM Source': utmSource,
      'UTM Medium': utmMedium,
      'UTM Campaign': utmCampaign,
      'UTM Term': utmTerm,
      'UTM Content': utmContent,
    });
  }, [pageName]);

  return null;
};

