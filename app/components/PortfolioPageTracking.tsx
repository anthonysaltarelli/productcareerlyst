'use client';

import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/amplitude/client';
import type { PortfolioUserState } from '@/app/api/portfolio/user-state/route';

interface PortfolioPageTrackingProps {
  pageName: 'Product Portfolio' | 'Portfolio Generate Ideas';
  viewMode?: 'discover' | 'request_selected' | 'favorites';
  selectedRequestId?: string | null;
}

/**
 * Component to track portfolio page views with comprehensive user state context
 * Uses a ref to prevent duplicate tracking in React StrictMode
 */
export const PortfolioPageTracking = ({
  pageName,
  viewMode,
  selectedRequestId,
}: PortfolioPageTrackingProps) => {
  const hasTracked = useRef(false);
  const [userState, setUserState] = useState<PortfolioUserState | null>(null);

  useEffect(() => {
    // Fetch user state
    const fetchUserState = async () => {
      try {
        const response = await fetch('/api/portfolio/user-state');
        if (response.ok) {
          const data = await response.json();
          setUserState(data.state);
        }
      } catch (error) {
        console.error('Error fetching portfolio user state:', error);
      }
    };

    fetchUserState();
  }, []);

  useEffect(() => {
    // Prevent duplicate tracking (React StrictMode runs effects twice in dev)
    if (hasTracked.current || !userState) {
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

    // Map page names to specific event names
    const eventNameMap: Record<string, string> = {
      'Product Portfolio': 'User Viewed Product Portfolio Page',
      'Portfolio Generate Ideas': 'User Viewed Portfolio Generate Ideas Page',
    };

    const eventName = eventNameMap[pageName] || `User Viewed ${pageName} Page`;

    // Build base properties
    const baseProperties: Record<string, any> = {
      'Page Route': pageRoute,
      'Page Name': pageName,
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
      'Traffic Source': trafficSource,
      'Is Internal Referrer': isInternalReferrer,
      'UTM Source': utmSource,
      'UTM Medium': utmMedium,
      'UTM Campaign': utmCampaign,
      'UTM Term': utmTerm,
      'UTM Content': utmContent,
      
      // User state context
      'User Plan': userState.userPlan,
      'Has Active Subscription': userState.hasActiveSubscription,
      'Days Since Sign Up': userState.daysSinceSignUp,
      'Total Portfolio Requests': userState.totalPortfolioRequests,
      'Total Favorited Ideas': userState.totalFavoritedIdeas,
      'Has Completed Portfolio Course': userState.hasCompletedPortfolioCourse,
      'Has Pending Template Request': userState.hasPendingTemplateRequest,
      'Template Request Status': userState.templateRequestStatus,
    };

    // Add page-specific properties
    if (pageName === 'Portfolio Generate Ideas') {
      baseProperties['View Mode'] = viewMode || 'discover';
      baseProperties['Selected Request ID'] = selectedRequestId || null;
      baseProperties['Is First Time User'] = userState.totalPortfolioRequests === 0;
      baseProperties['Has Favorites'] = userState.totalFavoritedIdeas > 0;
    }

    trackEvent(eventName, baseProperties);
  }, [pageName, viewMode, selectedRequestId, userState]);

  return null;
};


