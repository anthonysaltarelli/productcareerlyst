'use client';

import { useEffect, useRef } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { trackEvent } from '@/lib/amplitude/client';
import { getDashboardTrackingContext } from '@/lib/utils/dashboard-tracking-context';
import { getDeviceType, getGridPosition } from '@/lib/utils/template-resource-utils';
import type { DashboardStats } from '@/app/api/dashboard/stats/route';

interface Subscription {
  plan: 'learn' | 'accelerate' | null;
  status: string | null;
  isActive: boolean;
}

interface TemplatesPageTrackingProps {
  stats: DashboardStats | null;
  subscription: Subscription | null;
  userCreatedAt?: string | null;
}

/**
 * Component to track PM Templates page views with comprehensive user state context
 * Uses a ref to prevent duplicate tracking in React StrictMode
 */
export const TemplatesPageTracking = ({
  stats,
  subscription,
  userCreatedAt,
}: TemplatesPageTrackingProps) => {
  const hasTracked = useRef(false);
  const { coach, compensation, impactPortfolio, careerTracker } = useFlags();
  
  const featureFlags = {
    coach,
    compensation,
    impactPortfolio,
    careerTracker,
  };

  useEffect(() => {
    // Prevent duplicate tracking (React StrictMode runs effects twice in dev)
    if (hasTracked.current) {
      return;
    }
    hasTracked.current = true;

    // Get current URL and referrer information (safely handle invalid URLs)
    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
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

    // Get viewport dimensions
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const deviceType = getDeviceType(viewportWidth);

    // Determine grid layout based on viewport width
    const gridLayout = viewportWidth < 768 ? '1-column' : viewportWidth < 1024 ? '2-column' : '3-column';

    // Check if this is first template page visit
    const isFirstTemplatePageVisit = typeof window !== 'undefined' 
      ? !localStorage.getItem('templates-page-visited')
      : false;
    
    if (typeof window !== 'undefined' && isFirstTemplatePageVisit) {
      localStorage.setItem('templates-page-visited', 'true');
    }

    // Get user state context
    const userStateContext = getDashboardTrackingContext(
      stats,
      subscription,
      featureFlags,
      { createdAt: userCreatedAt }
    );

    // Track templates page view with all context
    trackEvent('User Viewed PM Templates Page', {
      // Standard page view properties
      'Page Route': pageRoute,
      'Page Name': 'PM Templates',
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
      'Traffic Source': trafficSource,
      'Is Internal Referrer': isInternalReferrer,
      'UTM Source': utmSource,
      'UTM Medium': utmMedium,
      'UTM Campaign': utmCampaign,
      'UTM Term': utmTerm,
      'UTM Content': utmContent,

      // Page-specific context
      'Is First Template Page Visit': isFirstTemplatePageVisit,
      'Total Resources Available': 20,
      'Viewport Width': viewportWidth,
      'Viewport Height': viewportHeight,
      'Device Type': deviceType,
      'Grid Layout': gridLayout,

      // User state context (comprehensive)
      ...userStateContext,
    });
  }, [stats, subscription, coach, compensation, impactPortfolio, careerTracker, userCreatedAt]);

  return null;
};










