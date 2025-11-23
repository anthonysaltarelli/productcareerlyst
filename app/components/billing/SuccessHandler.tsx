'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Check, RefreshCw, AlertCircle } from 'lucide-react';
import { trackEvent } from '@/lib/amplitude/client';

export const SuccessHandler = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const successTracked = useRef(false);

  useEffect(() => {
    if (success === 'true' && !synced && !syncing && !shouldHide) {
      // Track success page view if not already tracked
      if (!successTracked.current) {
        const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/dashboard/billing';
        const referrer = typeof window !== 'undefined' ? document.referrer : '';
        let referrerDomain: string | null = null;
        if (referrer) {
          try {
            referrerDomain = new URL(referrer).hostname;
          } catch {
            referrerDomain = null;
          }
        }

        trackEvent('User Viewed Billing Page with Success', {
          'Page Route': pageRoute,
          'Success Type': 'subscription_created',
          'Plan': null, // Would need to get from subscription after sync
          'Billing Cadence': null,
          'Referrer URL': referrer || 'None',
          'Success Message': 'Payment successful! Your subscription is being activated...',
        });
        successTracked.current = true;
      }
      
      // Auto-sync subscription when success=true
      syncSubscription();
    }
  }, [success, synced, syncing, shouldHide]);

  // Hide message after showing success for a few seconds
  useEffect(() => {
    if (synced) {
      const timer = setTimeout(() => {
        setShouldHide(true);
        // Remove success param from URL
        router.replace(pathname);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [synced, router, pathname]);

  const syncSubscription = async () => {
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sync subscription');
      }

      setSynced(true);
      setSyncing(false);
      
      // Refresh to show updated subscription
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSyncing(false);
    }
  };

  if ((!success && !canceled) || shouldHide) {
    return null;
  }

  if (canceled === 'true') {
    return (
      <div className="mb-6 p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-800 font-semibold">
              Checkout was canceled. No charges were made.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
          <div className="flex-1">
            <p className="text-blue-800 font-semibold mb-2">
              Payment successful! Syncing your subscription...
            </p>
            <p className="text-blue-700 text-sm">
              This may take a few seconds. Please wait.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200">
        <div className="flex items-start gap-3 mb-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-semibold mb-2">
              Payment successful, but we couldn't sync your subscription automatically.
            </p>
            <p className="text-red-700 text-sm mb-3">{error}</p>
            <button
              onClick={syncSubscription}
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
            >
              Try Syncing Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (synced) {
    // Show success message briefly, then it will be hidden when URL param is removed
    return (
      <div className="mb-6 p-4 rounded-xl bg-green-50 border-2 border-green-200">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-semibold">
              Subscription synced successfully! Your subscription is now active.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-xl bg-green-50 border-2 border-green-200">
      <div className="flex items-start gap-3">
        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-green-800 font-semibold">
            Payment successful! Your subscription is being activated...
          </p>
        </div>
      </div>
    </div>
  );
};

