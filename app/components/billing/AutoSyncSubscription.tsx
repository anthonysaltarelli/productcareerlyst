'use client';

import { useEffect, useState } from 'react';
import { Subscription } from '@/lib/utils/subscription';
import { useRouter } from 'next/navigation';

interface AutoSyncSubscriptionProps {
  subscription: Subscription | null;
  /**
   * Minimum time in minutes between syncs (default: 5 minutes)
   */
  minSyncIntervalMinutes?: number;
}

const SYNC_STORAGE_KEY = 'subscription_sync_timestamp';
const SYNC_SESSION_KEY = 'subscription_synced_this_session';

export const AutoSyncSubscription = ({ 
  subscription,
  minSyncIntervalMinutes = 5 
}: AutoSyncSubscriptionProps) => {
  const router = useRouter();
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    if (hasSynced) {
      return;
    }

    // No subscription, no need to sync
    if (!subscription) {
      setHasSynced(true);
      return;
    }

    // Check if we've already synced in this browser session
    if (typeof window !== 'undefined') {
      const syncedThisSession = sessionStorage.getItem(SYNC_SESSION_KEY);
      if (syncedThisSession === 'true') {
        setHasSynced(true);
        return;
      }

      // Check if we've synced recently (within the minimum interval)
      const lastSyncTimestamp = localStorage.getItem(SYNC_STORAGE_KEY);
      if (lastSyncTimestamp) {
        const lastSync = parseInt(lastSyncTimestamp, 10);
        const now = Date.now();
        const minIntervalMs = minSyncIntervalMinutes * 60 * 1000;
        
        if (now - lastSync < minIntervalMs) {
          // Too soon to sync again, mark as synced for this session
          setHasSynced(true);
          return;
        }
      }
    }

    let isMounted = true;
    const syncSubscription = async () => {
      try {
        const response = await fetch('/api/stripe/sync-subscription', {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to sync subscription');
        }

        if (!isMounted) {
          return;
        }

        // Mark as synced in session storage (prevents multiple syncs per session)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SYNC_SESSION_KEY, 'true');
          localStorage.setItem(SYNC_STORAGE_KEY, Date.now().toString());
        }

        setHasSynced(true);
        router.refresh();
      } catch (err) {
        if (!isMounted) {
          return;
        }

        console.error('Auto-sync failed:', err);
        // Still mark as synced to prevent retry loops
        setHasSynced(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SYNC_SESSION_KEY, 'true');
        }
      }
    };

    syncSubscription();

    return () => {
      isMounted = false;
    };
  }, [hasSynced, router, subscription, minSyncIntervalMinutes]);

  return null;
};

