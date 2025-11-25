'use client';

import { useEffect, useRef } from 'react';
import { trackEventWithCourseContext } from '@/lib/amplitude/client';

interface CoursePageTrackingProps {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseCategory: string;
  courseDescription: string;
  courseLength: string;
  totalLessons: number;
  premiumLessonsCount: number;
  freeLessonsCount: number;
}

/**
 * Component to track course page views with course-specific user context
 */
export const CoursePageTracking = ({
  courseId,
  courseTitle,
  courseSlug,
  courseCategory,
  courseDescription,
  courseLength,
  totalLessons,
  premiumLessonsCount,
  freeLessonsCount,
}: CoursePageTrackingProps) => {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent duplicate tracking
    if (hasTracked.current) {
      return;
    }
    hasTracked.current = true;

    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '';
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

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

    // Track page view with course context
    trackEventWithCourseContext('User Viewed Course Page', courseId, {
      'Page Route': pageRoute,
      'Course ID': courseId,
      'Course Title': courseTitle,
      'Course Slug': courseSlug,
      'Course Category': courseCategory,
      'Course Description': courseDescription,
      'Course Length': courseLength,
      'Total Lessons': totalLessons,
      'Premium Lessons Count': premiumLessonsCount,
      'Free Lessons Count': freeLessonsCount,
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
      'UTM Source': urlParams?.get('utm_source') || null,
      'UTM Medium': urlParams?.get('utm_medium') || null,
      'UTM Campaign': urlParams?.get('utm_campaign') || null,
    });
  }, [
    courseId,
    courseTitle,
    courseSlug,
    courseCategory,
    courseDescription,
    courseLength,
    totalLessons,
    premiumLessonsCount,
    freeLessonsCount,
  ]);

  return null;
};





