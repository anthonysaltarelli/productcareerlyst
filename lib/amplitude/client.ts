'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { getDeviceId } from '@/lib/utils/device-id';
import { trackEventBrowser, identifyUserBrowser, isBrowserSdkInitialized } from '@/lib/amplitude/browser';
import { getUserContext, getCourseUserContext, getLessonUserContext, type UserContext } from '@/lib/amplitude/user-context';

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
  // Use Browser SDK if initialized (for Session Replay integration)
  // Otherwise, fall back to API route
  const useBrowserSdk = typeof window !== 'undefined' && 
                        process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY && 
                        isBrowserSdkInitialized();

  if (useBrowserSdk) {
    // Browser SDK is initialized - use it only (no double-sending)
    try {
      trackEventBrowser(eventType, eventProperties);
      return; // Exit early - don't send to API route
    } catch (browserError) {
      // If Browser SDK fails, fall back to API route
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Browser SDK tracking failed, falling back to API route:', browserError);
      }
      // Continue to API route fallback below
    }
  }

  // Fallback: Send to API route (server-side tracking)
  // This is used when Browser SDK is not initialized or fails
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
  // Use Browser SDK if initialized (for Session Replay integration)
  // Otherwise, fall back to API route
  const useBrowserSdk = typeof window !== 'undefined' && 
                        process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY && 
                        isBrowserSdkInitialized();

  if (useBrowserSdk) {
    // Browser SDK is initialized - use it only (no double-sending)
    try {
      identifyUserBrowser(userId, userProperties);
      return; // Exit early - don't send to API route
    } catch (browserError) {
      // If Browser SDK fails, fall back to API route
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Browser SDK identification failed, falling back to API route:', browserError);
      }
      // Continue to API route fallback below
    }
  }

  // Fallback: Send to API route (server-side identification)
  // This is used when Browser SDK is not initialized or fails
  // Fire-and-forget: don't await, just send it off
  (async () => {
    try {
      // Get device ID to help Amplitude merge anonymous sessions with identified users
      const deviceId = getDeviceId();

      if (process.env.NODE_ENV === 'development') {
        console.log('👤 Identifying user in Amplitude (API route):', {
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

/**
 * Track an event with user context automatically included
 * Fetches user context and merges it with event properties
 * NON-BLOCKING: Fires events asynchronously without waiting for context
 * SINGLE-SEND: Sends event exactly once with merged context (or without if context fetch fails)
 */
export const trackEventWithContext = async (
  eventType: string,
  eventProperties?: Record<string, any>
) => {
  // Try to fetch user context with a short timeout
  // If we can't get it quickly, send event without context
  setTimeout(async () => {
    try {
      const contextPromise = getUserContext();
      const timeoutPromise = new Promise<UserContext>((resolve) => {
        setTimeout(() => resolve({
          'User Subscription Plan': 'none',
          'User Subscription Status': 'none',
          'User Has Active Subscription': false,
          'User Subscription Billing Cadence': 'none',
          'Days Since Subscription Started': null,
          'Days Until Subscription Renewal': null,
          'Is Trial User': false,
          'User Onboarding Complete': false,
          'Days Since Sign Up': null,
          'User First Course Started': false,
          'User First Lesson Completed': false,
          'User Total Courses Started': 0,
          'User Total Lessons Completed': 0,
          'User Total Lessons Started': 0,
          'User Authentication Status': 'anonymous',
        }), 100); // 100ms timeout
      });
      
      const userContext = await Promise.race([contextPromise, timeoutPromise]);
      const mergedProperties = {
        ...eventProperties,
        ...userContext,
      };
      trackEvent(eventType, mergedProperties);
    } catch (error) {
      // If context fetch fails, send event without context
      trackEvent(eventType, eventProperties);
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Error fetching user context for tracking (non-blocking):', error);
      }
    }
  }, 0);
};

/**
 * Track an event with course-specific user context
 * Includes course progress information
 * SINGLE-SEND: Sends event exactly once with merged context (or without if context fetch fails)
 */
export const trackEventWithCourseContext = async (
  eventType: string,
  courseId: string,
  eventProperties?: Record<string, any>
) => {
  // Try to fetch course context with a short timeout
  // If we can't get it quickly, send event without context
  setTimeout(async () => {
    try {
      const contextPromise = getCourseUserContext(courseId);
      const timeoutPromise = new Promise<Awaited<ReturnType<typeof getCourseUserContext>>>((resolve) => {
        setTimeout(() => resolve({
          'User Subscription Plan': 'none',
          'User Subscription Status': 'none',
          'User Has Active Subscription': false,
          'User Subscription Billing Cadence': 'none',
          'Days Since Subscription Started': null,
          'Days Until Subscription Renewal': null,
          'Is Trial User': false,
          'User Onboarding Complete': false,
          'Days Since Sign Up': null,
          'User First Course Started': false,
          'User First Lesson Completed': false,
          'User Total Courses Started': 0,
          'User Total Lessons Completed': 0,
          'User Total Lessons Started': 0,
          'User Authentication Status': 'anonymous',
          'User Course Progress Percentage': 0,
          'User Completed Lessons in Course': 0,
          'User Started Lessons in Course': 0,
        }), 100); // 100ms timeout
      });
      
      const courseContext = await Promise.race([contextPromise, timeoutPromise]);
      const mergedProperties = {
        ...eventProperties,
        ...courseContext,
      };
      trackEvent(eventType, mergedProperties);
    } catch (error) {
      // If context fetch fails, send event without context
      trackEvent(eventType, eventProperties);
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Error fetching course context for tracking (non-blocking):', error);
      }
    }
  }, 0);
};

/**
 * Track an event with lesson-specific user context
 * Includes lesson and course progress information
 * SINGLE-SEND: Sends event exactly once with merged context (or without if context fetch fails)
 */
export const trackEventWithLessonContext = async (
  eventType: string,
  lessonId: string,
  courseId: string,
  eventProperties?: Record<string, any>
) => {
  // Try to fetch lesson context with a short timeout
  // If we can't get it quickly, send event without context
  setTimeout(async () => {
    try {
      const contextPromise = getLessonUserContext(lessonId, courseId);
      const timeoutPromise = new Promise<Awaited<ReturnType<typeof getLessonUserContext>>>((resolve) => {
        setTimeout(() => resolve({
          'User Subscription Plan': 'none',
          'User Subscription Status': 'none',
          'User Has Active Subscription': false,
          'User Subscription Billing Cadence': 'none',
          'Days Since Subscription Started': null,
          'Days Until Subscription Renewal': null,
          'Is Trial User': false,
          'User Onboarding Complete': false,
          'Days Since Sign Up': null,
          'User First Course Started': false,
          'User First Lesson Completed': false,
          'User Total Courses Started': 0,
          'User Total Lessons Completed': 0,
          'User Total Lessons Started': 0,
          'User Authentication Status': 'anonymous',
          'User Has Completed Lesson': false,
          'User Has Started Lesson': false,
          'User Watch Duration Seconds': 0,
          'User Course Progress Percentage': 0,
          'User Completed Lessons in Course': 0,
          'User Started Lessons in Course': 0,
        }), 100); // 100ms timeout
      });
      
      const lessonContext = await Promise.race([contextPromise, timeoutPromise]);
      const mergedProperties = {
        ...eventProperties,
        ...lessonContext,
      };
      trackEvent(eventType, mergedProperties);
    } catch (error) {
      // If context fetch fails, send event without context
      trackEvent(eventType, eventProperties);
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Error fetching lesson context for tracking (non-blocking):', error);
      }
    }
  }, 0);
};

