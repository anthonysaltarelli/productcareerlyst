'use client';

import { useEffect, useRef } from 'react';
import { Lock, Sparkles, Rocket } from 'lucide-react';
import { TrackedLink } from '@/app/components/TrackedLink';
import { trackEvent } from '@/lib/amplitude/client';

interface PremiumLessonGateProps {
  lessonTitle: string;
  lessonId: string;
  lessonDescription?: string | null;
  lessonDuration?: number | null;
  courseTitle: string;
  courseId: string;
  currentPlan: 'learn' | 'accelerate' | null;
}

export const PremiumLessonGate = ({
  lessonTitle,
  lessonId,
  lessonDescription,
  lessonDuration,
  courseTitle,
  courseId,
  currentPlan,
}: PremiumLessonGateProps) => {
  const tracked = useRef(false);

  // Track component view
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';

    trackEvent('User Viewed Premium Lesson Gate', {
      'Component Type': 'premium_lesson_gate',
      'Lesson ID': lessonId,
      'Lesson Title': lessonTitle,
      'Course ID': courseId,
      'Course Title': courseTitle,
      'Current Plan': currentPlan || 'none',
      'Page Route': pageRoute,
      'Gate Position': 'Lesson Content Area',
    });
  }, [lessonId, lessonTitle, courseId, courseTitle, currentPlan]);


  return (
    <div className="flex items-center justify-center min-h-[500px] bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 rounded-lg border-2 border-gray-200 p-8">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-200 mx-auto mb-6">
          <Lock className="w-10 h-10 text-purple-600" />
        </div>

        {/* Content */}
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          {lessonTitle}
        </h2>
        {lessonDuration && (
          <p className="text-sm text-gray-500 mb-3 flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {lessonDuration} min
          </p>
        )}
        {lessonDescription && (
          <p className="text-gray-600 mb-6 text-sm">
            {lessonDescription}
          </p>
        )}
        {/* Unified Premium Upsell Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-purple-600" />
            <p className="text-purple-800 font-bold text-sm">
              Premium Lesson
            </p>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3 bg-white/60 rounded-lg px-3 py-2">
              <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span className="text-sm text-gray-700">Access all premium lessons and courses</span>
            </div>
            <div className="flex items-center gap-3 bg-white/60 rounded-lg px-3 py-2">
              <Rocket className="w-4 h-4 text-pink-600 flex-shrink-0" />
              <span className="text-sm text-gray-700">Unlock advanced learning content</span>
            </div>
          </div>

          <TrackedLink
            href="/dashboard/billing"
            linkId="premium-lesson-gate-view-billing-link"
            eventName="User Clicked View Billing From Premium Lesson Gate"
            eventProperties={{
              'Component Type': 'premium_lesson_gate',
              'Lesson ID': lessonId,
              'Lesson Title': lessonTitle,
              'Course ID': courseId,
              'Course Title': courseTitle,
              'Current Plan': currentPlan || 'none',
              'Link Section': 'Premium Lesson Gate',
              'Link Position': 'Primary CTA',
              'Link Text': 'View Plans & Pricing',
              'Link Type': 'Primary CTA',
              'Link Context': 'Below premium lesson gate content',
              'Page Route': typeof window !== 'undefined' ? window.location.pathname : '/',
            }}
            className="inline-block w-full px-6 py-3 text-base font-bold rounded-xl transition-all bg-gradient-to-br from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl text-center"
          >
            View Plans & Pricing
          </TrackedLink>
        </div>
      </div>
    </div>
  );
};

