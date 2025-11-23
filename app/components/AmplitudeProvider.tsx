'use client';

import { useEffect, useRef } from 'react';
import { useUserEmail, identifyUser } from '@/lib/amplitude/client';

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
  const identifiedEmail = useRef<string | null>(null);

  useEffect(() => {
    // When user email is available, explicitly identify the user in Amplitude
    // This handles cases where user is already logged in when app loads
    if (email && email !== identifiedEmail.current) {
      identifiedEmail.current = email;
      identifyUser(email);
    }
  }, [email]);

  return <>{children}</>;
};

