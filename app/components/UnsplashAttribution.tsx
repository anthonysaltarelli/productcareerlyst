'use client';

import { getUnsplashProfileUrl, getUnsplashUrl } from '@/lib/types/unsplash';

// ============================================================================
// Types
// ============================================================================

interface UnsplashAttributionProps {
  photographerName: string;
  photographerUsername: string;
  className?: string;
  /** Position of the attribution relative to the image */
  position?: 'bottom-right' | 'bottom-left' | 'below';
}

// ============================================================================
// Component
// ============================================================================

/**
 * UnsplashAttribution Component
 * 
 * Displays proper attribution for Unsplash photos as required by their guidelines.
 * Attribution format: "Photo by [Name] on Unsplash"
 * 
 * Both links include UTM parameters as required by Unsplash:
 * - Photographer profile: https://unsplash.com/@username?utm_source=productcareerlyst&utm_medium=referral
 * - Unsplash: https://unsplash.com/?utm_source=productcareerlyst&utm_medium=referral
 */
const UnsplashAttribution = ({
  photographerName,
  photographerUsername,
  className = '',
  position = 'bottom-right',
}: UnsplashAttributionProps) => {
  const profileUrl = getUnsplashProfileUrl(photographerUsername);
  const unsplashUrl = getUnsplashUrl();

  // Position classes
  const positionClasses = {
    'bottom-right': 'absolute bottom-2 right-2',
    'bottom-left': 'absolute bottom-2 left-2',
    'below': 'mt-1 text-right',
  };

  // Base styling for both absolute and relative positions
  const baseClasses = position === 'below'
    ? 'text-xs text-gray-500'
    : 'rounded-md bg-black/50 px-2 py-1 text-xs text-white/90 backdrop-blur-sm';

  return (
    <div className={`${positionClasses[position]} ${baseClasses} ${className}`}>
      Photo by{' '}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`font-medium ${position === 'below' ? 'text-gray-700 hover:text-gray-900' : 'text-white hover:underline'}`}
      >
        {photographerName}
      </a>
      {' '}on{' '}
      <a
        href={unsplashUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`font-medium ${position === 'below' ? 'text-gray-700 hover:text-gray-900' : 'text-white hover:underline'}`}
      >
        Unsplash
      </a>
    </div>
  );
};

export default UnsplashAttribution;

