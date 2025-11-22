'use client';

import { useState, useEffect } from 'react';
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

    fetchRequest();
    fetchUserPlan();
  }, []);

  const handleSubmit = async () => {
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
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error submitting request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const hasPendingRequest = request?.status === 'pending';

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
      />
    </>
  );
};

