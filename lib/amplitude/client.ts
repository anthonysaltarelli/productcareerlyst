'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { getDeviceId } from '@/lib/utils/device-id';
import { trackEventBrowser } from '@/lib/amplitude/browser';

/**
 * Client-side Amplitude tracking utility
 * Uses Browser SDK when available (for Session Replay), falls back to API routes
 */

/**
 * Track an event from the client side
 * Uses Browser SDK when available (for Session Replay), always also sends to API route
 * NON-BLOCKING: Fires events asynchronously without waiting for response
 * @param eventType - Event name in Title Case: [Noun] [Past-Tense Verb]
 * @param eventProperties - Optional event properties in Title Case
 */
export const trackEvent = (
  eventType: string,
  eventProperties?: Record<string, any>
) => {
  // Try Browser SDK first (for Session Replay integration)
  // This ensures events are associated with session replays
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) {
    try {
      trackEventBrowser(eventType, eventProperties);
    } catch (browserError) {
      // If Browser SDK fails, continue to API route
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Browser SDK tracking failed, using API route only:', browserError);
      }
    }
  }

  // Always also send to API route for server-side tracking
  // This ensures events are captured even if Browser SDK isn't initialized
  // Fire-and-forget: don't await, just send it off
  // Get user ID asynchronously with timeout - never block on this
  (async () => {
    try {
      const supabase = createClient();
      const deviceId = getDeviceId(); // Get device ID immediately (synchronous)
      
      // Try to get user, but don't wait more than 50ms
      let userId: string | undefined = undefined;
      try {
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) => {
          setTimeout(() => resolve({ data: { user: null } }), 50); // 50ms timeout
        });
        const result = await Promise.race([getUserPromise, timeoutPromise]);
        userId = result.data?.user?.email || undefined;
      } catch {
        // If getUser fails or times out, just proceed without userId
        userId = undefined;
      }

      // Call API route to track event (fire-and-forget, no await)
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 Sending event to Amplitude (API route):', {
          eventType,
          hasProperties: !!eventProperties,
          userId: userId || 'anonymous',
          deviceId: deviceId || 'none',
        });
      }

      // Fire off the fetch without awaiting - analytics should never block
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          eventProperties,
          userId,
          deviceId: userId ? undefined : deviceId, // Only send deviceId if no userId
        }),
      }).catch((error) => {
        // Silently handle fetch errors - analytics should never block or spam console
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Analytics tracking failed (non-blocking):', error);
        }
      });
    } catch (error) {
      // Silently handle errors - analytics should never block
      // If everything fails, try to send event without any user info
      try {
        const deviceId = getDeviceId();
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType,
            eventProperties,
            userId: undefined,
            deviceId,
          }),
        }).catch(() => {
          // Silently fail - analytics should never block
        });
      } catch {
        // Silently fail - analytics should never block
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Analytics tracking error (non-blocking):', error);
      }
    }
  })();
};

/**
 * Identify a user in Amplitude
 * This should be called when a user logs in or signs up to explicitly set their user ID
 * Passes device_id to help Amplitude merge anonymous sessions with identified users
 * NON-BLOCKING: Fires identification asynchronously without waiting for response
 * @param userId - User's email address
 * @param userProperties - Optional user properties to set
 */
export const identifyUser = (
  userId: string,
  userProperties?: Record<string, any>
) => {
  // Fire-and-forget: don't await, just send it off
  (async () => {
    try {
      // Get device ID to help Amplitude merge anonymous sessions with identified users
      const deviceId = getDeviceId();

      if (process.env.NODE_ENV === 'development') {
        console.log('👤 Identifying user in Amplitude:', {
          userId,
          deviceId,
          hasProperties: !!userProperties,
        });
      }

      // Fire off the fetch without awaiting - analytics should never block
      fetch('/api/analytics/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          deviceId,
          userProperties,
        }),
      }).catch((error) => {
        // Silently handle fetch errors - analytics should never block or spam console
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Analytics identification failed (non-blocking):', error);
        }
      });
    } catch (error) {
      // Silently handle errors - analytics should never block
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Analytics identification error (non-blocking):', error);
      }
    }
  })();
};

/**
 * Hook to get current user email for tracking
 */
export const useUserEmail = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setEmail(user?.email || null);
      } catch (error) {
        console.error('Error getting user email:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserEmail();
  }, []);

  return { email, loading };
};

