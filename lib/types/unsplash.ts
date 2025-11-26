/**
 * Unsplash Types
 * 
 * Types for Unsplash API integration
 */

// ============================================================================
// Photo Types
// ============================================================================

export interface UnsplashPhoto {
  id: string;
  description: string;
  urls: {
    thumb: string;
    small: string;
    regular: string;
    full: string;
    cover: string; // Custom cropped URL for cover images
  };
  downloadLocation: string;
  photographer: {
    name: string;
    username: string;
    profileUrl: string;
    profileImage: string;
  };
  dimensions: {
    width: number;
    height: number;
  };
  color: string;
  blurHash: string | null;
}

// ============================================================================
// Search Response Types
// ============================================================================

export interface UnsplashSearchResponse {
  total: number;
  totalPages: number;
  photos: UnsplashPhoto[];
  attribution: {
    unsplashUrl: string;
    utmSource: string;
    utmMedium: string;
  };
}

// ============================================================================
// Attribution Types
// ============================================================================

export interface UnsplashAttribution {
  photoId: string;
  photographerName: string;
  photographerUsername: string;
  downloadLocation: string;
}

// ============================================================================
// Image Source Types
// ============================================================================

export type CoverImageSource = 'upload' | 'template' | 'unsplash';

// ============================================================================
// Constants
// ============================================================================

export const UNSPLASH_UTM_SOURCE = 'productcareerlyst';
export const UNSPLASH_UTM_MEDIUM = 'referral';

/**
 * Get the Unsplash profile URL with UTM parameters
 */
export const getUnsplashProfileUrl = (username: string): string => {
  return `https://unsplash.com/@${username}?utm_source=${UNSPLASH_UTM_SOURCE}&utm_medium=${UNSPLASH_UTM_MEDIUM}`;
};

/**
 * Get the Unsplash homepage URL with UTM parameters
 */
export const getUnsplashUrl = (): string => {
  return `https://unsplash.com/?utm_source=${UNSPLASH_UTM_SOURCE}&utm_medium=${UNSPLASH_UTM_MEDIUM}`;
};

