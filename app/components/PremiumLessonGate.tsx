'use client';

import { useEffect, useRef } from 'react';
import { Lock, Sparkles, Rocket } from 'lucide-react';
import { TrackedLink } from '@/app/components/TrackedLink';
import { trackEvent } from '@/lib/amplitude/client';

interface PremiumLessonGateProps {
  lessonTitle: string;
  lessonId: string;
  courseTitle: string;
  courseId: string;
  currentPlan: 'learn' | 'accelerate' | null;
}

export const PremiumLessonGate = ({
  lessonTitle,
  lessonId,
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
        <h2 className="text-3xl font-black text-gray-900 mb-4">
          Premium Lesson Locked
        </h2>
        <p className="text-gray-700 font-semibold mb-2 text-lg">
          This lesson is available for Learn and Accelerate plan subscribers.
        </p>
        <p className="text-gray-600 mb-8">
          Upgrade your plan to unlock access to all premium lessons and accelerate your career growth.
        </p>

        {/* Benefits */}
        <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">What you'll get:</h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Full Course Library</p>
                <p className="text-sm text-gray-600">Access all premium lessons and courses</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Rocket className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Career Acceleration</p>
                <p className="text-sm text-gray-600">Unlock advanced learning content</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
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
          className="inline-block w-full px-6 py-4 text-base font-bold rounded-xl transition-all bg-gradient-to-br from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl text-center"
        >
          View Plans & Pricing
        </TrackedLink>
      </div>
    </div>
  );
};

