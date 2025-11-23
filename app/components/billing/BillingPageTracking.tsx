'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/amplitude/client';
import { getUserStateContextFromSubscription, UserStateContext, Subscription } from '@/lib/utils/billing-tracking-client';

interface BillingPageTrackingProps {
  subscription: Subscription | null;
  accountCreatedAt: string | null;
}

/**
 * Component to track billing page views with user state context
 */
export const BillingPageTracking = ({ subscription, accountCreatedAt }: BillingPageTrackingProps) => {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const userState = getUserStateContextFromSubscription(subscription, accountCreatedAt);

    // Get current URL and referrer information
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

    // Get UTM parameters
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

    // Check for success parameter and determine success type
    const successParam = urlParams?.get('success');
    let successType: 'subscription_created' | 'subscription_updated' | 'payment_method_updated' | 'subscription_reactivated' | null = null;
    if (successParam === 'true') {
      // Try to determine success type from context
      // If user had no subscription before, it's subscription_created
      // If user had subscription, could be updated or reactivated
      if (!subscription) {
        successType = 'subscription_created';
      } else {
        // Could be updated or reactivated - default to created for new subscriptions
        successType = 'subscription_created';
      }
    }

    // Track page view
    trackEvent('User Viewed Billing Page', {
      'Page Route': pageRoute,
      'Page Section': 'Billing Management',
      'User State': userState.userOnboardingStage,
      'Current Plan': userState.currentPlan,
      'Current Billing Cadence': userState.currentBillingCadence,
      'Subscription Status': userState.subscriptionStatus,
      'Cancel at Period End': userState.cancelAtPeriodEnd,
      'Days Since Subscription Start': userState.daysSinceSubscriptionStart,
      'Days Until Period End': userState.daysUntilPeriodEnd,
      'Is Trial User': userState.isTrialUser,
      'Has Past Due': userState.hasPastDue,
      'Days Since Account Creation': userState.daysSinceAccountCreation,
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
      'UTM Source': urlParams?.get('utm_source') || null,
      'UTM Medium': urlParams?.get('utm_medium') || null,
      'UTM Campaign': urlParams?.get('utm_campaign') || null,
      ...(successType && {
        'Success Type': successType,
        'Success Message': 'Subscription created successfully',
      }),
    });
  }, [subscription, accountCreatedAt]);

  return null;
};

