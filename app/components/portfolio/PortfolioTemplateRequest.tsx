'use client';

import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/amplitude/client';
import PortfolioTemplateRequestModal from '@/app/components/portfolio/PortfolioTemplateRequestModal';

type RequestStatus = 'pending' | 'fulfilled' | 'cancelled' | null;

interface TemplateRequest {
  id: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export const PortfolioTemplateRequest = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<TemplateRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userPlan, setUserPlan] = useState<'learn' | 'accelerate' | null>(null);
  const [showAccelerateModal, setShowAccelerateModal] = useState(false);
  const [userState, setUserState] = useState<{
    totalPortfolioRequests: number;
    totalFavoritedIdeas: number;
    hasCompletedPortfolioCourse: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/portfolio/template-request');
        if (response.ok) {
          const data = await response.json();
          setRequest(data.request);
        }
      } catch (err) {
        console.error('Error fetching request:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setUserPlan(data.stats?.subscription?.plan || null);
        }
      } catch (err) {
        console.error('Error fetching user plan:', err);
      }
    };

    const fetchUserState = async () => {
      try {
        const response = await fetch('/api/portfolio/user-state');
        if (response.ok) {
          const data = await response.json();
          setUserState({
            totalPortfolioRequests: data.state.totalPortfolioRequests,
            totalFavoritedIdeas: data.state.totalFavoritedIdeas,
            hasCompletedPortfolioCourse: data.state.hasCompletedPortfolioCourse,
          });
        }
      } catch (err) {
        console.error('Error fetching user state:', err);
      }
    };

    fetchRequest();
    fetchUserPlan();
    fetchUserState();
  }, []);

  const handleSubmit = async () => {
    // Track click event
    setTimeout(() => {
      try {
        const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
        const referrer = typeof window !== 'undefined' ? document.referrer : '';
        let referrerDomain: string | null = null;
        if (referrer) {
          try {
            referrerDomain = new URL(referrer).hostname;
          } catch {
            referrerDomain = null;
          }
        }
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        
        trackEvent('User Clicked Request Template Button', {
          'Button ID': 'portfolio-template-request-submit-button',
          'Button Section': 'Template Request Section',
          'Button Position': 'Center of Template Request Card',
          'Button Text': 'Request Template →',
          'Button Type': 'Premium Feature CTA',
          'Button Context': 'Below "Request Product Portfolio Template" description',
          'Page Section': 'Below the fold',
          'User Plan': userPlan,
          'Has Active Subscription': userPlan !== null,
          'Has Pending Request': hasPendingRequest,
          'Template Request Status': request?.status || null,
          'Will Show Upgrade Modal': userPlan !== 'accelerate',
          'Total Portfolio Requests': userState?.totalPortfolioRequests || 0,
          'Total Favorited Ideas': userState?.totalFavoritedIdeas || 0,
          'Has Completed Portfolio Course': userState?.hasCompletedPortfolioCourse || false,
          'Page Route': pageRoute,
          'Referrer URL': referrer || 'None',
          'Referrer Domain': referrerDomain || 'None',
          'UTM Source': urlParams?.get('utm_source') || null,
          'UTM Medium': urlParams?.get('utm_medium') || null,
          'UTM Campaign': urlParams?.get('utm_campaign') || null,
        });
      } catch (error) {
        // Silently fail
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Tracking error (non-blocking):', error);
        }
      }
    }, 0);

    // Check if user is on Accelerate plan
    if (userPlan !== 'accelerate') {
      setShowAccelerateModal(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/portfolio/template-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's an Accelerate plan required error
        if (data.requiresAccelerate || response.status === 403) {
          setShowAccelerateModal(true);
        } else {
          setError(data.error || 'Failed to submit request');
        }
        return;
      }

      setSuccess(true);
      setRequest(data.request);

      // Track successful submission
      setTimeout(() => {
        try {
          const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
          const referrer = typeof window !== 'undefined' ? document.referrer : '';
          let referrerDomain: string | null = null;
          if (referrer) {
            try {
              referrerDomain = new URL(referrer).hostname;
            } catch {
              referrerDomain = null;
            }
          }
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          
          trackEvent('User Submitted Template Request Successfully', {
            'Request ID': data.request?.id || null,
            'User Plan': 'accelerate',
            'Has Active Subscription': true,
            'Total Portfolio Requests': userState?.totalPortfolioRequests || 0,
            'Total Favorited Ideas': userState?.totalFavoritedIdeas || 0,
            'Has Completed Portfolio Course': userState?.hasCompletedPortfolioCourse || false,
            'Days Since Sign Up': null, // Would need to fetch separately
            'Page Route': pageRoute,
            'Referrer URL': referrer || 'None',
            'Referrer Domain': referrerDomain || 'None',
            'UTM Source': urlParams?.get('utm_source') || null,
            'UTM Medium': urlParams?.get('utm_medium') || null,
            'UTM Campaign': urlParams?.get('utm_campaign') || null,
          });
        } catch (error) {
          // Silently fail
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Tracking error (non-blocking):', error);
          }
        }
      }, 0);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error submitting request:', err);

      // Track error
      setTimeout(() => {
        try {
          const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
          const referrer = typeof window !== 'undefined' ? document.referrer : '';
          let referrerDomain: string | null = null;
          if (referrer) {
            try {
              referrerDomain = new URL(referrer).hostname;
            } catch {
              referrerDomain = null;
            }
          }
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          
          const errorData = err instanceof Error ? err.message : 'Unknown error';
          let errorType = 'server_error';
          if (errorData.includes('Accelerate') || errorData.includes('plan')) {
            errorType = 'plan_required';
          } else if (errorData.includes('pending')) {
            errorType = 'already_pending';
          } else if (errorData.includes('Unauthorized')) {
            errorType = 'unauthorized';
          }
          
          trackEvent('Template Request Error', {
            'Error Message': errorData.substring(0, 100), // Sanitized
            'Error Type': errorType,
            'User Plan': userPlan,
            'Has Active Subscription': userPlan !== null,
            'Has Pending Request': hasPendingRequest,
            'Total Portfolio Requests': userState?.totalPortfolioRequests || 0,
            'Page Route': pageRoute,
            'Referrer URL': referrer || 'None',
            'Referrer Domain': referrerDomain || 'None',
            'UTM Source': urlParams?.get('utm_source') || null,
            'UTM Medium': urlParams?.get('utm_medium') || null,
            'UTM Campaign': urlParams?.get('utm_campaign') || null,
          });
        } catch (error) {
          // Silently fail
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Tracking error (non-blocking):', error);
          }
        }
      }, 0);
    } finally {
      setSubmitting(false);
    }
  };

  const hasPendingRequest = request?.status === 'pending';
  const hasFulfilledRequest = request?.status === 'fulfilled';

  return (
    <>
      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-green-400 to-emerald-400 shadow-[0_6px_0_0_rgba(22,163,74,0.4)] border-2 border-green-500 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">📋</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Request Product Portfolio Template
            </h2>
            <p className="text-gray-700 font-medium mb-4">
              Get a professionally designed product portfolio template delivered to your email. We'll send it to you within 24-48 hours typically.
            </p>

            {loading ? (
              <div className="text-gray-600 font-medium">Loading...</div>
            ) : hasFulfilledRequest ? (
              <div className="space-y-3">
                <div className="p-4 rounded-[1.5rem] bg-white/80 border-2 border-green-300">
                  <p className="text-gray-800 font-semibold mb-1">
                    ✓ Template Delivered
                  </p>
                  <p className="text-gray-600 text-sm">
                    Your portfolio template has been delivered! Check your email for the template.
                  </p>
                  {request?.updated_at && (
                    <p className="text-gray-500 text-xs mt-2">
                      Delivered on {new Date(request.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ) : hasPendingRequest ? (
              <div className="space-y-3">
                <div className="p-4 rounded-[1.5rem] bg-white/80 border-2 border-green-300">
                  <p className="text-gray-800 font-semibold mb-1">
                    ✓ Request Submitted
                  </p>
                  <p className="text-gray-600 text-sm">
                    Your template request is pending. You'll receive it via email within 24-48 hours.
                  </p>
                  {request?.created_at && (
                    <p className="text-gray-500 text-xs mt-2">
                      Requested on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ) : success ? (
              <div className="space-y-3">
                <div className="p-4 rounded-[1.5rem] bg-white/80 border-2 border-green-300">
                  <p className="text-gray-800 font-semibold mb-1">
                    ✓ Request Submitted Successfully!
                  </p>
                  <p className="text-gray-600 text-sm">
                    Your portfolio template request has been submitted. You'll receive it via email within 24-48 hours.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {error && (
                  <div className="p-4 rounded-[1.5rem] bg-red-100 border-2 border-red-300">
                    <p className="text-red-800 font-semibold text-sm">{error}</p>
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-block px-6 py-3 rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-green-300 font-black text-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Request Template →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accelerate Plan Required Modal */}
      <PortfolioTemplateRequestModal
        isOpen={showAccelerateModal}
        onClose={() => setShowAccelerateModal(false)}
        hasSubscription={userPlan !== null}
        userPlan={userPlan}
        totalPortfolioRequests={userState?.totalPortfolioRequests || 0}
        totalFavoritedIdeas={userState?.totalFavoritedIdeas || 0}
      />
    </>
  );
};

