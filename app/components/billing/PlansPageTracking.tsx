'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/amplitude/client';
import { getUserStateContextFromSubscription, Subscription } from '@/lib/utils/billing-tracking-client';

interface PlansPageTrackingProps {
  subscription: Subscription | null;
  accountCreatedAt: string | null;
}

/**
 * Component to track plans page views with user state context
 */
export const PlansPageTracking = ({ subscription, accountCreatedAt }: PlansPageTrackingProps) => {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const userState = getUserStateContextFromSubscription(subscription, accountCreatedAt);

    // Get current URL and referrer information
    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/dashboard/billing/plans';
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    let referrerDomain: string | null = null;
    if (referrer) {
      try {
        referrerDomain = new URL(referrer).hostname;
      } catch {
        referrerDomain = null;
      }
    }

    // Get UTM parameters
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

    trackEvent('User Viewed Plans Page', {
      'Page Route': pageRoute,
      'User State': userState.userOnboardingStage,
      'Current Plan': userState.currentPlan,
      'Current Billing Cadence': userState.currentBillingCadence,
      'Days Since Account Creation': userState.daysSinceAccountCreation,
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
      'UTM Source': urlParams?.get('utm_source') || null,
      'UTM Medium': urlParams?.get('utm_medium') || null,
      'UTM Campaign': urlParams?.get('utm_campaign') || null,
    });
  }, [subscription, accountCreatedAt]);

  return null;
};


