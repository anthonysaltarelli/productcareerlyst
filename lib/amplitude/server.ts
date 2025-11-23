import { init, track, identify, Identify, flush } from '@amplitude/analytics-node';

let isInitialized = false;

/**
 * Initialize Amplitude SDK on the server side
 * Should be called once when the server starts
 */
export const initializeAmplitude = () => {
  if (isInitialized) {
    return;
  }

  const apiKey = process.env.AMPLITUDE_API_KEY;
  const apiSecretKey = process.env.AMPLITUDE_API_SECRET_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ Amplitude API key not found. Analytics will be disabled.');
    console.warn('Set AMPLITUDE_API_KEY in your environment variables.');
    return;
  }

  try {
    init(apiKey, {
      flushIntervalMillis: 30 * 1000, // Flush every 30 seconds
      flushQueueSize: 30, // Flush when 30 events are queued
      // logLevel will use default (Warn) - can be configured via Types.LogLevel if needed
      // apiSecretKey can be used for additional server-side authentication if needed
    });

    isInitialized = true;
    console.log('✅ Amplitude initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Amplitude:', error);
  }
};

/**
 * Track an event on the server side
 * @param eventType - Event name in Title Case: [Noun] [Past-Tense Verb]
 * @param eventProperties - Optional event properties
 * @param userId - Optional user ID (email address for authenticated users)
 * @param deviceId - Optional device ID (for anonymous users)
 */
export const trackEvent = async (
  eventType: string,
  eventProperties?: Record<string, any>,
  userId?: string,
  deviceId?: string
) => {
  if (!isInitialized) {
    initializeAmplitude();
  }

  const options: { user_id?: string; device_id?: string } = {};
  
  if (userId) {
    options.user_id = userId;
  } else if (deviceId) {
    // Only set device_id if no user_id (Amplitude requires one or the other)
    options.device_id = deviceId;
  }

  // Ensure we have at least one identifier
  if (!options.user_id && !options.device_id) {
    console.error('❌ Amplitude event requires either user_id or device_id');
    console.error('Event:', eventType, 'Properties:', eventProperties);
    return;
  }

  // Fire-and-forget: Don't await the promise to avoid blocking
  // The event will be queued and sent by Amplitude's flush mechanism
  track(eventType, eventProperties, options).promise
    .then((result) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Amplitude event tracked:', {
          eventType,
          userId: options.user_id || 'anonymous',
          deviceId: options.device_id || 'none',
          result: result?.code || 'pending',
        });
      }
    })
    .catch((error) => {
      console.error('❌ Error tracking Amplitude event:', error);
      console.error('Event details:', { eventType, eventProperties, options });
    });
};

/**
 * Identify user with properties
 * @param userId - User's email address
 * @param deviceId - Optional device ID to help Amplitude merge anonymous sessions
 * @param userProperties - Optional user properties to set
 */
export const identifyUser = async (
  userId: string,
  deviceId?: string,
  userProperties?: Record<string, any>
) => {
  if (!isInitialized) {
    initializeAmplitude();
  }

  try {
    const identifyObj = new Identify();
    
    if (userProperties) {
      Object.entries(userProperties).forEach(([key, value]) => {
        identifyObj.set(key, value);
      });
    }

    // Include device_id to help Amplitude merge anonymous sessions with identified users
    const options: { user_id: string; device_id?: string } = { user_id: userId };
    if (deviceId) {
      options.device_id = deviceId;
    }

    // Fire-and-forget: Don't await the promise to avoid blocking
    identify(identifyObj, options).promise
      .then(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ User identified:', {
            userId,
            deviceId: deviceId || 'none',
          });
        }
      })
      .catch((error) => {
        console.error('Error identifying Amplitude user:', error);
      });
  } catch (error) {
    console.error('Error identifying Amplitude user:', error);
  }
};

/**
 * Flush pending events
 */
export const flushEvents = async () => {
  if (!isInitialized) {
    return;
  }

  try {
    await flush().promise;
  } catch (error) {
    console.error('Error flushing Amplitude events:', error);
  }
};

