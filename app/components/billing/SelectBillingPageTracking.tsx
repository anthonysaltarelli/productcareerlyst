'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/amplitude/client';
import { getUserStateContextFromSubscription, Subscription } from '@/lib/utils/billing-tracking-client';

interface SelectBillingPageTrackingProps {
  plan: 'learn' | 'accelerate';
  subscription: Subscription | null;
  accountCreatedAt: string | null;
}

/**
 * Component to track select billing page views
 */
export const SelectBillingPageTracking = ({ plan, subscription, accountCreatedAt }: SelectBillingPageTrackingProps) => {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const userState = getUserStateContextFromSubscription(subscription, accountCreatedAt);

    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/dashboard/billing/select-billing';
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    let referrerDomain: string | null = null;
    if (referrer) {
      try {
        referrerDomain = new URL(referrer).hostname;
      } catch {
        referrerDomain = null;
      }
    }

    trackEvent('User Viewed Select Billing Page', {
      'Page Route': pageRoute,
      'Plan Selected': plan,
      'User State': userState.userOnboardingStage,
      'Current Plan': userState.currentPlan,
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
    });
  }, [plan, subscription, accountCreatedAt]);

  return null;
};


