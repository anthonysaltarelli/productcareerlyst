'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/amplitude/client';

/**
 * Client component that adds tracking to homepage interactions
 * Tracks page view when the homepage loads
 * Uses a ref to prevent duplicate tracking in React StrictMode
 */
export const HomePageTracking = () => {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent duplicate tracking (React StrictMode runs effects twice in dev)
    if (hasTracked.current) {
      return;
    }
    hasTracked.current = true;

    // Get referrer information (safely handle invalid URLs)
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    let referrerDomain: string | null = null;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        referrerDomain = referrerUrl.hostname;
      } catch {
        // Invalid referrer URL - ignore silently
        referrerDomain = null;
      }
    }
    
    // Check if referrer is from same domain (internal navigation)
    const isInternalReferrer = referrerDomain && typeof window !== 'undefined' 
      ? referrerDomain === window.location.hostname 
      : false;
    
    // Get UTM parameters from URL
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const utmSource = urlParams?.get('utm_source') || null;
    const utmMedium = urlParams?.get('utm_medium') || null;
    const utmCampaign = urlParams?.get('utm_campaign') || null;
    const utmTerm = urlParams?.get('utm_term') || null;
    const utmContent = urlParams?.get('utm_content') || null;
    
    // Determine traffic source
    let trafficSource = 'Direct';
    if (utmSource) {
      trafficSource = `UTM: ${utmSource}`;
    } else if (isInternalReferrer) {
      trafficSource = 'Internal';
    } else if (referrerDomain) {
      // Check if it's a known referrer
      if (referrerDomain.includes('google')) {
        trafficSource = 'Google';
      } else if (referrerDomain.includes('facebook') || referrerDomain.includes('fb')) {
        trafficSource = 'Facebook';
      } else if (referrerDomain.includes('twitter') || referrerDomain.includes('x.com')) {
        trafficSource = 'Twitter';
      } else if (referrerDomain.includes('linkedin')) {
        trafficSource = 'LinkedIn';
      } else if (referrerDomain.includes('youtube')) {
        trafficSource = 'YouTube';
      } else {
        trafficSource = `Referral: ${referrerDomain}`;
      }
    }
    
    // Track homepage view
    trackEvent('User Viewed Homepage', {
      'Page Route': '/',
      'Page Type': 'Landing Page',
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
      'Traffic Source': trafficSource,
      'Is Internal Referrer': isInternalReferrer,
      'UTM Source': utmSource,
      'UTM Medium': utmMedium,
      'UTM Campaign': utmCampaign,
      'UTM Term': utmTerm,
      'UTM Content': utmContent,
    });
  }, []);

  return null;
};

