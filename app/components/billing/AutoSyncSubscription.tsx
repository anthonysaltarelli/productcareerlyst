'use client';

import { useEffect, useState } from 'react';
import { Subscription } from '@/lib/utils/subscription';

interface AutoSyncSubscriptionProps {
  subscription: Subscription | null;
}

export const AutoSyncSubscription = ({ subscription }: AutoSyncSubscriptionProps) => {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    // Only sync if we have a subscription and haven't synced yet
    if (!subscription || synced) return;

    // Check if data is stale (older than 5 minutes)
    const lastUpdated = new Date(subscription.updated_at);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

    // If data is older than 5 minutes, sync from Stripe
    if (minutesSinceUpdate > 5) {
      const syncSubscription = async () => {
        try {
          await fetch('/api/stripe/sync-subscription', {
            method: 'POST',
          });
          setSynced(true);
          // Refresh the page to show updated data
          window.location.reload();
        } catch (err) {
          console.error('Auto-sync failed:', err);
          // Don't show error to user, just log it
        }
      };

      syncSubscription();
    } else {
      setSynced(true);
    }
  }, [subscription, synced]);

  // This component doesn't render anything
  return null;
};

