'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { getDeviceId } from '@/lib/utils/device-id';

/**
 * Client-side Amplitude tracking utility
 * Uses API routes to track events (which use the Node.js SDK on the server)
 */

/**
 * Track an event from the client side
 * @param eventType - Event name in Title Case: [Noun] [Past-Tense Verb]
 * @param eventProperties - Optional event properties in Title Case
 */
export const trackEvent = async (
  eventType: string,
  eventProperties?: Record<string, any>
) => {
  try {
    // Get current user email if authenticated
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.email || undefined;

    // Get device ID for anonymous users
    const deviceId = userId ? undefined : getDeviceId();

    // Call API route to track event
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Sending event to Amplitude:', {
        eventType,
        hasProperties: !!eventProperties,
        userId: userId || 'anonymous',
        deviceId: deviceId || 'none',
      });
    }

    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        eventProperties,
        userId,
        deviceId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Tracking failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Event sent successfully:', eventType);
    }
  } catch (error) {
    // Always log errors for debugging
    console.error('❌ Error tracking event:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
};

/**
 * Identify a user in Amplitude
 * This should be called when a user logs in or signs up to explicitly set their user ID
 * @param userId - User's email address
 * @param userProperties - Optional user properties to set
 */
export const identifyUser = async (
  userId: string,
  userProperties?: Record<string, any>
) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 Identifying user in Amplitude:', {
        userId,
        hasProperties: !!userProperties,
      });
    }

    const response = await fetch('/api/analytics/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userProperties,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Identification failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User identified successfully:', userId);
    }
  } catch (error) {
    // Always log errors for debugging
    console.error('❌ Error identifying user:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
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

