/**
 * Utility to generate and persist device ID for Amplitude tracking
 * Device ID is stored in localStorage and persists across sessions
 */

const DEVICE_ID_KEY = 'amplitude_device_id';

/**
 * Generate a unique device ID
 */
const generateDeviceId = (): string => {
  // Generate a UUID-like string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Get or create device ID from localStorage
 * Falls back to generating a new one if localStorage is not available
 */
export const getDeviceId = (): string => {
  if (typeof window === 'undefined') {
    // Server-side: generate a temporary ID (shouldn't happen in our flow)
    return generateDeviceId();
  }

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      deviceId = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      if (process.env.NODE_ENV === 'development') {
        console.log('🆔 Generated new device ID:', deviceId);
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.log('🆔 Using existing device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    // If localStorage is not available, generate a temporary ID
    console.warn('localStorage not available, generating temporary device ID');
    return generateDeviceId();
  }
};

