'use client';

import { useEffect, useState } from 'react';
import { Subscription } from '@/lib/utils/subscription';
import { useRouter } from 'next/navigation';

interface AutoSyncSubscriptionProps {
  subscription: Subscription | null;
}

export const AutoSyncSubscription = ({ subscription }: AutoSyncSubscriptionProps) => {
  const router = useRouter();
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    if (hasSynced) {
      return;
    }

    if (!subscription) {
      setHasSynced(true);
      return;
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

        setHasSynced(true);
        router.refresh();
      } catch (err) {
        if (!isMounted) {
          return;
        }

        console.error('Auto-sync failed:', err);
        setHasSynced(true);
      }
    };

    syncSubscription();

    return () => {
      isMounted = false;
    };
  }, [hasSynced, router, subscription]);

  return null;
};

