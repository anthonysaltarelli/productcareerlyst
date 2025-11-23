"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Lock, Sparkles, Rocket } from "lucide-react";
import { TrackedButton } from "@/app/components/TrackedButton";
import { trackEvent } from "@/lib/amplitude/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription?: string;
  currentPlan?: 'learn' | 'accelerate' | null;
  requiresAccelerate?: boolean;
};

export default function PremiumFeatureGateModal({
  isOpen,
  onClose,
  featureName,
  featureDescription,
  currentPlan,
  requiresAccelerate = false,
}: Props) {
  const defaultDescription = requiresAccelerate
    ? "This feature is available exclusively for Accelerate plan subscribers."
    : "This feature is available for Learn and Accelerate plan subscribers.";
  
  const finalDescription = featureDescription || defaultDescription;
  const router = useRouter();
  const tracked = useRef(false);

  // Track modal view
  useEffect(() => {
    if (!isOpen || tracked.current) return;
    tracked.current = true;

    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';

    trackEvent('User Viewed Premium Feature Gate Modal', {
      'Component Type': 'premium_feature_gate_modal',
      'Feature Name': featureName,
      'Current Plan': currentPlan || 'none',
      'Page Route': pageRoute,
      'Modal Position': 'Overlay',
    });
  }, [isOpen, featureName, currentPlan]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleViewBilling = () => {
    trackEvent('User Clicked View Billing From Premium Feature Gate Modal', {
      'Component Type': 'premium_feature_gate_modal',
      'Feature Name': featureName,
      'Current Plan': currentPlan || 'none',
      'Button Section': 'Premium Feature Gate Modal',
      'Button Position': 'Primary CTA',
      'Button Text': 'View Plans & Pricing',
      'Page Route': typeof window !== 'undefined' ? window.location.pathname : '/',
    });
    router.push("/dashboard/billing");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200 pointer-events-auto"
        onDragStart={(e) => e.preventDefault()}
        onDrag={(e) => e.preventDefault()}
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-200 mx-auto mb-5">
          <Lock className="w-8 h-8 text-purple-600" />
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          {requiresAccelerate ? 'Accelerate Plan Required' : 'Premium Feature Locked'}
        </h2>
        <p className="text-gray-600 text-center mb-2 font-medium">
          {finalDescription}
        </p>
        <p className="text-gray-500 text-center mb-6 text-sm">
          Upgrade your plan to unlock access to this feature and accelerate your career growth.
        </p>

        {/* Benefits */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 mb-6 border border-purple-200">
          <h3 className="text-sm font-bold text-gray-900 mb-3 text-center">What you'll get:</h3>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Full Feature Access</p>
                <p className="text-xs text-gray-600">Unlock all premium features and tools</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Rocket className="w-4 h-4 text-pink-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Career Acceleration</p>
                <p className="text-xs text-gray-600">Access advanced AI-powered tools</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <TrackedButton
            onClick={handleViewBilling}
            buttonId="premium-feature-gate-modal-view-billing-button"
            eventName="User Clicked View Billing From Premium Feature Gate Modal"
            eventProperties={{
              'Component Type': 'premium_feature_gate_modal',
              'Feature Name': featureName,
              'Current Plan': currentPlan || 'none',
              'Button Section': 'Premium Feature Gate Modal',
              'Button Position': 'Primary CTA',
              'Button Text': 'View Plans & Pricing',
              'Button Type': 'Primary CTA',
              'Page Route': typeof window !== 'undefined' ? window.location.pathname : '/',
            }}
            className="w-full px-5 py-3 text-sm font-bold rounded-xl transition-all bg-gradient-to-br from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl"
          >
            View Plans & Pricing
          </TrackedButton>
          <button
            onClick={onClose}
            className="w-full px-5 py-3 text-sm font-bold rounded-xl transition-all border-2 text-gray-700 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

