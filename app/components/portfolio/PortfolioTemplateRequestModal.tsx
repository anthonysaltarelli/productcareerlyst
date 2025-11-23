"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";
import { trackEvent } from '@/lib/amplitude/client';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  hasSubscription?: boolean;
  userPlan?: 'learn' | 'accelerate' | null;
  totalPortfolioRequests?: number;
  totalFavoritedIdeas?: number;
};

export default function PortfolioTemplateRequestModal({
  isOpen,
  onClose,
  hasSubscription = false,
  userPlan = null,
  totalPortfolioRequests = 0,
  totalFavoritedIdeas = 0,
}: Props) {
  const router = useRouter();

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

  const handleViewPlans = () => {
    // Track click event
    setTimeout(() => {
      try {
        const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
        const referrer = typeof window !== 'undefined' ? document.referrer : '';
        let referrerDomain: string | null = null;
        if (referrer) {
          try {
            referrerDomain = new URL(referrer).hostname;
          } catch {
            referrerDomain = null;
          }
        }
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const linkDestination = hasSubscription ? '/dashboard/billing' : '/dashboard/billing/plans';
        
        trackEvent('User Clicked Template Request Upgrade Modal View Plans', {
          'Button ID': 'portfolio-template-upgrade-modal-view-plans-button',
          'Button Section': 'Upgrade Modal',
          'Button Position': 'Primary CTA in modal',
          'Button Text': hasSubscription ? 'Manage Subscription' : 'View Plans',
          'Button Type': 'Primary Modal CTA',
          'Button Context': 'In Accelerate Plan Required modal',
          'Has Subscription': hasSubscription,
          'User Plan': userPlan,
          'Link Destination': linkDestination,
          'Total Portfolio Requests': totalPortfolioRequests,
          'Total Favorited Ideas': totalFavoritedIdeas,
          'Page Route': pageRoute,
          'Referrer URL': referrer || 'None',
          'Referrer Domain': referrerDomain || 'None',
          'UTM Source': urlParams?.get('utm_source') || null,
          'UTM Medium': urlParams?.get('utm_medium') || null,
          'UTM Campaign': urlParams?.get('utm_campaign') || null,
        });
      } catch (error) {
        // Silently fail
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Tracking error (non-blocking):', error);
        }
      }
    }, 0);

    // If user has a subscription, go to billing management page
    // Otherwise, go to plan selection page
    if (hasSubscription) {
      router.push("/dashboard/billing");
    } else {
      router.push("/dashboard/billing/plans");
    }
    onClose();
  };

  const handleCancel = () => {
    // Track cancel event
    setTimeout(() => {
      try {
        const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
        const referrer = typeof window !== 'undefined' ? document.referrer : '';
        let referrerDomain: string | null = null;
        if (referrer) {
          try {
            referrerDomain = new URL(referrer).hostname;
          } catch {
            referrerDomain = null;
          }
        }
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        
        trackEvent('User Clicked Template Request Upgrade Modal Cancel', {
          'Button ID': 'portfolio-template-upgrade-modal-cancel-button',
          'Button Section': 'Upgrade Modal',
          'Button Position': 'Secondary button in modal',
          'Button Text': 'Cancel',
          'Button Type': 'Secondary Modal Button',
          'Button Context': 'In Accelerate Plan Required modal',
          'Has Subscription': hasSubscription,
          'User Plan': userPlan,
          'Total Portfolio Requests': totalPortfolioRequests,
          'Total Favorited Ideas': totalFavoritedIdeas,
          'Page Route': pageRoute,
          'Referrer URL': referrer || 'None',
          'Referrer Domain': referrerDomain || 'None',
          'UTM Source': urlParams?.get('utm_source') || null,
          'UTM Medium': urlParams?.get('utm_medium') || null,
          'UTM Campaign': urlParams?.get('utm_campaign') || null,
        });
      } catch (error) {
        // Silently fail
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Tracking error (non-blocking):', error);
        }
      }
    }, 0);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl border-2 border-green-200 mx-auto mb-5">
          <Rocket className="w-8 h-8 text-green-600" />
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Accelerate Plan Required
        </h2>
        <p className="text-gray-600 text-center mb-8 font-medium">
          Product portfolio template requests are available exclusively for Accelerate plan subscribers. Upgrade to unlock this feature and get your professionally designed portfolio template delivered to your email.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleViewPlans}
            className="w-full px-5 py-3 text-sm font-bold rounded-xl transition-all bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-sm"
          >
            {hasSubscription ? 'Manage Subscription' : 'View Plans'}
          </button>
          <button
            onClick={handleCancel}
            className="w-full px-5 py-3 text-sm font-bold rounded-xl transition-all border-2 text-gray-700 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

