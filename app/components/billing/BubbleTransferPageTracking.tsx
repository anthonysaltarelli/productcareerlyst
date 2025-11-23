'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/amplitude/client';
import { getUserStateContextFromSubscription, Subscription } from '@/lib/utils/billing-tracking-client';

interface BubbleTransferPageTrackingProps {
  subscription: Subscription | null;
  accountCreatedAt: string | null;
}

/**
 * Component to track bubble transfer page views
 */
export const BubbleTransferPageTracking = ({ subscription, accountCreatedAt }: BubbleTransferPageTrackingProps) => {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const userState = getUserStateContextFromSubscription(subscription, accountCreatedAt);

    trackEvent('User Viewed Bubble Transfer Page', {
      'Page Route': '/dashboard/billing/transfer',
      'User State': userState.userOnboardingStage,
      'Days Since Account Creation': userState.daysSinceAccountCreation,
      'Has Used Feature': false, // Would need to fetch separately
    });
  }, [subscription, accountCreatedAt]);

  return null;
};


