'use client';

import { useEffect, useRef } from 'react';
import { useUserEmail, identifyUser } from '@/lib/amplitude/client';
import { 
  initializeAmplitudeBrowser, 
  identifyUserBrowser 
} from '@/lib/amplitude/browser';

/**
 * Amplitude provider component that:
 * 1. Initializes Browser SDK with Session Replay on mount
 * 2. Ensures user identification is ready when user logs in
 * 3. Provides context for tracking throughout the app
 */
export const AmplitudeProvider = ({ 
  children,
}: { 
  children: React.ReactNode;
}) => {
  const { email } = useUserEmail();
  const identifiedEmail = useRef<string | null>(null);
  const browserSdkInitialized = useRef(false);

  useEffect(() => {
    // Initialize Browser SDK with Session Replay on mount
    if (!browserSdkInitialized.current) {
      browserSdkInitialized.current = true;
      initializeAmplitudeBrowser(email || undefined);
    }
  }, []);

  useEffect(() => {
    // When user email is available, identify the user in both SDKs
    // This handles cases where user is already logged in when app loads
    if (email && email !== identifiedEmail.current) {
      identifiedEmail.current = email;
      
      // Identify in server-side SDK (via API route)
      identifyUser(email);
      
      // Identify in Browser SDK (for Session Replay)
      identifyUserBrowser(email);
    }
  }, [email]);

  return <>{children}</>;
};

