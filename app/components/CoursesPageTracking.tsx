'use client';

import { useEffect, useRef } from 'react';
import { trackEventWithContext } from '@/lib/amplitude/client';

interface CoursesPageTrackingProps {
  totalCategories: number;
  totalCourses: number;
}

/**
 * Component to track courses page views with user context
 */
export const CoursesPageTracking = ({
  totalCategories,
  totalCourses,
}: CoursesPageTrackingProps) => {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent duplicate tracking (React StrictMode runs effects twice in dev)
    if (hasTracked.current) {
      return;
    }
    hasTracked.current = true;

    // Get current URL and referrer information
    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/dashboard/courses';
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    let referrerDomain: string | null = null;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        referrerDomain = referrerUrl.hostname;
      } catch {
        referrerDomain = null;
      }
    }

    // Get UTM parameters
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

    // Track page view with user context
    trackEventWithContext('User Viewed Dashboard Courses Page', {
      'Page Route': pageRoute,
      'Total Categories': totalCategories,
      'Total Courses': totalCourses,
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
      'UTM Source': urlParams?.get('utm_source') || null,
      'UTM Medium': urlParams?.get('utm_medium') || null,
      'UTM Campaign': urlParams?.get('utm_campaign') || null,
    });
  }, [totalCategories, totalCourses]);

  return null;
};


