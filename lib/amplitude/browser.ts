'use client';

import * as amplitude from '@amplitude/analytics-browser';
import { Identify } from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { getDeviceId } from '@/lib/utils/device-id';

let isInitialized = false;
let sessionReplayPluginInstance: ReturnType<typeof sessionReplayPlugin> | null = null;

/**
 * Initialize Amplitude Browser SDK with Session Replay
 * Should be called once on the client side when the app loads
 * 
 * @param userId - Optional user ID (email address for authenticated users)
 * @param userProperties - Optional user properties to set
 */
export const initializeAmplitudeBrowser = async (
  userId?: string,
  userProperties?: Record<string, any>
) => {
  // Prevent multiple initializations
  if (isInitialized) {
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  
  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Amplitude API key not found. Session Replay will be disabled.');
      console.warn('Set NEXT_PUBLIC_AMPLITUDE_API_KEY in your environment variables.');
    }
    return;
  }

  try {
    // Get or create device ID
    const deviceId = getDeviceId();

    // Create and install Session Replay Plugin
    // Sample rate: 0.01 = 1% of sessions (adjust based on your quota)
    // Set to 1.0 (100%) for testing, then reduce for production
    const sampleRate = process.env.NODE_ENV === 'development' ? 1.0 : 0.01;

    sessionReplayPluginInstance = sessionReplayPlugin({
      sampleRate,
      // Enable session tracking for Session Replay
      forceSessionTracking: true,
      // Performance optimizations
      performanceConfig: {
        enabled: true,
        timeout: 5000, // 5 second timeout for idle callback
      },
      // Store replay events in IndexedDB for persistence
      storeType: 'idb',
      // Inline stylesheets to prevent broken replays
      shouldInlineStylesheet: true,
      // Debug mode in development
      debugMode: process.env.NODE_ENV === 'development',
    });

    // Add Session Replay plugin to Amplitude
    await amplitude.add(sessionReplayPluginInstance).promise;

    // Initialize Amplitude Browser SDK
    amplitude.init(apiKey, {
      // Set user ID if provided
      userId: userId || undefined,
      // Set device ID for anonymous users
      deviceId,
      // Enable session tracking
      defaultTracking: {
        sessions: true,
        pageViews: false, // We handle page views separately
        formInteractions: false,
        fileDownloads: false,
      },
      // Server zone (US or EU)
      serverZone: process.env.NEXT_PUBLIC_AMPLITUDE_SERVER_ZONE === 'EU' ? 'EU' : 'US',
    });

    // Set user properties if provided
    if (userProperties) {
      const identify = new Identify();
      Object.entries(userProperties).forEach(([key, value]) => {
        identify.set(key, value);
      });
      amplitude.identify(identify);
    }

    isInitialized = true;

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Amplitude Browser SDK with Session Replay initialized successfully');
      console.log('📊 Sample rate:', sampleRate * 100 + '%');
    }
  } catch (error) {
    console.error('❌ Error initializing Amplitude Browser SDK:', error);
  }
};

/**
 * Identify a user in Amplitude Browser SDK
 * Call this when a user logs in or their properties change
 * 
 * @param userId - User's email address
 * @param userProperties - Optional user properties to set
 */
export const identifyUserBrowser = (
  userId: string,
  userProperties?: Record<string, any>
) => {
  try {
    amplitude.setUserId(userId);

    if (userProperties) {
      const identify = new Identify();
      Object.entries(userProperties).forEach(([key, value]) => {
        identify.set(key, value);
      });
      amplitude.identify(identify);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User identified in Browser SDK:', userId);
    }
  } catch (error) {
    console.error('❌ Error identifying user in Browser SDK:', error);
  }
};

/**
 * Track an event using the Browser SDK
 * This is the preferred method for client-side tracking when Session Replay is enabled
 * 
 * @param eventType - Event name in Title Case: [Noun] [Past-Tense Verb]
 * @param eventProperties - Optional event properties in Title Case
 */
export const trackEventBrowser = (
  eventType: string,
  eventProperties?: Record<string, any>
) => {
  try {
    amplitude.track(eventType, eventProperties);

    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Browser SDK event tracked:', {
        eventType,
        hasProperties: !!eventProperties,
      });
    }
  } catch (error) {
    console.error('❌ Error tracking event in Browser SDK:', error);
  }
};

/**
 * Disable Session Replay collection
 * Useful for privacy-sensitive areas of the application
 */
export const disableSessionReplay = async () => {
  if (sessionReplayPluginInstance) {
    try {
      await amplitude.remove(sessionReplayPluginInstance.name).promise;
      if (process.env.NODE_ENV === 'development') {
        console.log('⏸️ Session Replay disabled');
      }
    } catch (error) {
      console.error('❌ Error disabling Session Replay:', error);
    }
  }
};

/**
 * Re-enable Session Replay collection
 * Call this after disabling to restart replay collection
 */
export const enableSessionReplay = async () => {
  if (sessionReplayPluginInstance && !isInitialized) {
    try {
      await amplitude.add(sessionReplayPluginInstance).promise;
      if (process.env.NODE_ENV === 'development') {
        console.log('▶️ Session Replay enabled');
      }
    } catch (error) {
      console.error('❌ Error enabling Session Replay:', error);
    }
  }
};

/**
 * Reset user identification
 * Call this when a user logs out
 */
export const resetUserBrowser = () => {
  try {
    amplitude.setUserId(null);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 User reset in Browser SDK');
    }
  } catch (error) {
    console.error('❌ Error resetting user in Browser SDK:', error);
  }
};

