'use client';

import { useEffect, useRef } from 'react';
import { Lock, FileText, Sparkles, Rocket } from 'lucide-react';
import { TrackedLink } from '@/app/components/TrackedLink';
import { trackEvent } from '@/lib/amplitude/client';

interface PremiumResourceGateProps {
  resourceTitle: string;
  resourceId: string;
  resourceCategory: string;
  currentPlan: 'learn' | 'accelerate' | null;
  onClose?: () => void;
}

export const PremiumResourceGate = ({
  resourceTitle,
  resourceId,
  resourceCategory,
  currentPlan,
  onClose,
}: PremiumResourceGateProps) => {
  const tracked = useRef(false);

  // Track component view
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';

    trackEvent('User Viewed Premium Resource Gate', {
      'Component Type': 'premium_resource_gate',
      'Resource ID': resourceId,
      'Resource Title': resourceTitle,
      'Resource Category': resourceCategory,
      'Current Plan': currentPlan || 'none',
      'Page Route': pageRoute,
      'Gate Position': 'Resource Modal',
    });
  }, [resourceId, resourceTitle, resourceCategory, currentPlan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative max-w-md w-full bg-white rounded-[2rem] shadow-2xl border-2 border-gray-200 p-8 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Icon */}
        <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl border-2 border-amber-200 mx-auto mb-6">
          <Lock className="w-10 h-10 text-amber-600" />
        </div>

        {/* Content */}
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 text-center">
          Premium Resource
        </h2>
        <p className="text-gray-700 font-semibold mb-2 text-center text-lg">
          &ldquo;{resourceTitle}&rdquo; is available for subscribers.
        </p>
        <p className="text-gray-600 mb-8 text-center">
          Upgrade to Learn or Accelerate to unlock all 20+ PM resources, templates, and guides.
        </p>

        {/* Benefits */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-8 border border-amber-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">What you&apos;ll get:</h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">20+ PM Resources</p>
                <p className="text-sm text-gray-600">Templates, guides, and frameworks</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Full Course Library</p>
                <p className="text-sm text-gray-600">120+ video lessons</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Rocket className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">AI-Powered Tools</p>
                <p className="text-sm text-gray-600">Resume optimizer, interview prep & more</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <TrackedLink
          href="/dashboard/billing"
          linkId="premium-resource-gate-view-billing-link"
          eventName="User Clicked View Billing From Premium Resource Gate"
          eventProperties={{
            'Component Type': 'premium_resource_gate',
            'Resource ID': resourceId,
            'Resource Title': resourceTitle,
            'Resource Category': resourceCategory,
            'Current Plan': currentPlan || 'none',
            'Link Section': 'Premium Resource Gate',
            'Link Position': 'Primary CTA',
            'Link Text': 'View Plans & Pricing',
            'Link Type': 'Primary CTA',
            'Link Context': 'Below premium resource gate content',
            'Page Route': typeof window !== 'undefined' ? window.location.pathname : '/',
          }}
          className="block w-full px-6 py-4 text-base font-bold rounded-xl transition-all bg-gradient-to-br from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl text-center"
        >
          View Plans & Pricing
        </TrackedLink>

        {/* Secondary text */}
        <p className="text-center text-sm text-gray-500 mt-4 font-medium">
          Plans start at $7/mo
        </p>
      </div>
    </div>
  );
};
