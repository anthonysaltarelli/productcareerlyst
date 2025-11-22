'use client';

import { useEffect } from 'react';
import { useUserEmail } from '@/lib/amplitude/client';
import { trackEvent } from '@/lib/amplitude/client';

/**
 * Amplitude provider component that:
 * 1. Ensures user identification is ready when user logs in
 * 2. Provides context for tracking throughout the app
 */
export const AmplitudeProvider = ({ 
  children,
}: { 
  children: React.ReactNode;
}) => {
  const { email } = useUserEmail();

  useEffect(() => {
    // When user email is available, we can identify the user
    // The actual identification happens server-side when events are tracked
    // This effect ensures we're ready to track with user context
    if (email) {
      // User is authenticated - events will automatically include user_id
      // No need to explicitly identify here since we pass userId in trackEvent
    }
  }, [email]);

  return <>{children}</>;
};

