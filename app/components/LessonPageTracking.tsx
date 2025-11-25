'use client';

import { useEffect, useRef } from 'react';
import { trackEventWithLessonContext } from '@/lib/amplitude/client';

interface LessonPageTrackingProps {
  lessonId: string;
  lessonTitle: string;
  lessonPosition: string;
  lessonPositionNumber: number;
  lessonRequiresSubscription: boolean;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseCategory: string;
  totalLessonsInCourse: number;
  previousLessonId: string | null;
  previousLessonTitle: string | null;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
  isFirstLesson: boolean;
  isLastLesson: boolean;
  videoUrl: string;
}

/**
 * Component to track lesson page views with lesson-specific user context
 */
export const LessonPageTracking = ({
  lessonId,
  lessonTitle,
  lessonPosition,
  lessonPositionNumber,
  lessonRequiresSubscription,
  courseId,
  courseTitle,
  courseSlug,
  courseCategory,
  totalLessonsInCourse,
  previousLessonId,
  previousLessonTitle,
  nextLessonId,
  nextLessonTitle,
  isFirstLesson,
  isLastLesson,
  videoUrl,
}: LessonPageTrackingProps) => {
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

    // Track page view with lesson context
    trackEventWithLessonContext('User Viewed Lesson Page', lessonId, courseId, {
      'Page Route': pageRoute,
      'Lesson ID': lessonId,
      'Lesson Title': lessonTitle,
      'Lesson Position': lessonPosition,
      'Lesson Position Number': lessonPositionNumber,
      'Lesson Requires Subscription': lessonRequiresSubscription,
      'Course ID': courseId,
      'Course Title': courseTitle,
      'Course Slug': courseSlug,
      'Course Category': courseCategory,
      'Total Lessons in Course': totalLessonsInCourse,
      'Previous Lesson ID': previousLessonId || null,
      'Previous Lesson Title': previousLessonTitle || null,
      'Next Lesson ID': nextLessonId || null,
      'Next Lesson Title': nextLessonTitle || null,
      'Is First Lesson in Course': isFirstLesson,
      'Is Last Lesson in Course': isLastLesson,
      'Video URL': videoUrl,
      'Video Provider': 'loom',
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
      'UTM Source': urlParams?.get('utm_source') || null,
      'UTM Medium': urlParams?.get('utm_medium') || null,
      'UTM Campaign': urlParams?.get('utm_campaign') || null,
    });
  }, [
    lessonId,
    lessonTitle,
    lessonPosition,
    lessonPositionNumber,
    lessonRequiresSubscription,
    courseId,
    courseTitle,
    courseSlug,
    courseCategory,
    totalLessonsInCourse,
    previousLessonId,
    previousLessonTitle,
    nextLessonId,
    nextLessonTitle,
    isFirstLesson,
    isLastLesson,
    videoUrl,
  ]);

  return null;
};





