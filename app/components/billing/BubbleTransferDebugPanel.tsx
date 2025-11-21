'use client';

import { useState, useEffect } from 'react';
import { Bug, ChevronDown, ChevronUp, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface DebugInfo {
  user: {
    id: string;
    email: string;
  };
  stripeMode: 'test' | 'live' | 'unknown';
  bubbleUser: {
    found: boolean;
    id?: string;
    email?: string;
    stripe_customer_id?: string;
    matched_user_id?: string;
    matched_at?: string;
    current_plan?: string;
    subscription_status?: string;
  };
  stripeCustomer: {
    found: boolean;
    id?: string;
    email?: string;
    mode?: string;
    error?: string;
  };
  subscription: {
    found: boolean;
    id?: string;
    status?: string;
    plan?: string;
    transferred_from_bubble?: boolean;
  };
  error?: string;
}

export const BubbleTransferDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/billing/debug-transfer');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch debug info');
      }
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !debugInfo && !loading) {
      fetchDebugInfo();
    }
  }, [isOpen]);

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-yellow-700" />
          <span className="font-bold text-yellow-900">Bubble Transfer Debug Panel (Dev Only)</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-yellow-700" />
        ) : (
          <ChevronDown className="w-5 h-5 text-yellow-700" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={fetchDebugInfo}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading && (
            <div className="text-center py-4 text-yellow-700">Loading debug info...</div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Error:</span>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {debugInfo && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  User Info
                </h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-semibold">ID:</span> {debugInfo.user.id}</div>
                  <div><span className="font-semibold">Email:</span> {debugInfo.user.email}</div>
                </div>
              </div>

              {/* Stripe Mode */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  {debugInfo.stripeMode === 'live' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : debugInfo.stripeMode === 'test' ? (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  Stripe Mode
                </h3>
                <div className="text-sm">
                  <span className={`font-semibold px-2 py-1 rounded ${
                    debugInfo.stripeMode === 'live' 
                      ? 'bg-green-100 text-green-800' 
                      : debugInfo.stripeMode === 'test'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {debugInfo.stripeMode.toUpperCase()}
                  </span>
                  {debugInfo.stripeMode === 'test' && (
                    <p className="text-yellow-700 mt-2 text-xs">
                      ⚠️ Using test mode keys. Live customers won't be accessible.
                    </p>
                  )}
                </div>
              </div>

              {/* Bubble User */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  {debugInfo.bubbleUser.found ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  Bubble User
                </h3>
                {debugInfo.bubbleUser.found ? (
                  <div className="space-y-1 text-sm">
                    <div><span className="font-semibold">ID:</span> {debugInfo.bubbleUser.id}</div>
                    <div><span className="font-semibold">Email:</span> {debugInfo.bubbleUser.email}</div>
                    <div><span className="font-semibold">Stripe Customer ID:</span> {debugInfo.bubbleUser.stripe_customer_id || 'None'}</div>
                    <div><span className="font-semibold">Plan:</span> {debugInfo.bubbleUser.current_plan || 'Unknown'}</div>
                    <div><span className="font-semibold">Status:</span> {debugInfo.bubbleUser.subscription_status || 'Unknown'}</div>
                    <div><span className="font-semibold">Matched:</span> {debugInfo.bubbleUser.matched_user_id ? 'Yes' : 'No'}</div>
                    {debugInfo.bubbleUser.matched_at && (
                      <div><span className="font-semibold">Matched At:</span> {new Date(debugInfo.bubbleUser.matched_at).toLocaleString()}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No bubble user found for this email</p>
                )}
              </div>

              {/* Stripe Customer */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  {debugInfo.stripeCustomer.found ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : debugInfo.stripeCustomer.error ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  Stripe Customer
                </h3>
                {debugInfo.stripeCustomer.found ? (
                  <div className="space-y-1 text-sm">
                    <div><span className="font-semibold">ID:</span> {debugInfo.stripeCustomer.id}</div>
                    <div><span className="font-semibold">Email:</span> {debugInfo.stripeCustomer.email || 'None'}</div>
                    <div><span className="font-semibold">Mode:</span> {debugInfo.stripeCustomer.mode || 'Unknown'}</div>
                  </div>
                ) : debugInfo.stripeCustomer.error ? (
                  <div className="text-sm">
                    <p className="text-red-600 font-semibold">Error:</p>
                    <p className="text-red-500 text-xs mt-1">{debugInfo.stripeCustomer.error}</p>
                    {debugInfo.stripeCustomer.error.includes('test mode') && (
                      <p className="text-yellow-700 text-xs mt-2">
                        💡 This customer exists in live mode, but you're using test mode keys. 
                        Switch to live mode keys to access this customer.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No Stripe customer found</p>
                )}
              </div>

              {/* Subscription */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  {debugInfo.subscription.found ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  Subscription
                </h3>
                {debugInfo.subscription.found ? (
                  <div className="space-y-1 text-sm">
                    <div><span className="font-semibold">ID:</span> {debugInfo.subscription.id}</div>
                    <div><span className="font-semibold">Status:</span> {debugInfo.subscription.status}</div>
                    <div><span className="font-semibold">Plan:</span> {debugInfo.subscription.plan}</div>
                    <div><span className="font-semibold">Transferred from Bubble:</span> {debugInfo.subscription.transferred_from_bubble ? 'Yes' : 'No'}</div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No subscription found in database</p>
                )}
              </div>

              {/* Recommendations */}
              {debugInfo.stripeMode === 'test' && debugInfo.bubbleUser.stripe_customer_id && (
                <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4">
                  <h3 className="font-bold text-yellow-900 mb-2">⚠️ Mode Mismatch Detected</h3>
                  <p className="text-yellow-800 text-sm">
                    Your Stripe customer ID ({debugInfo.bubbleUser.stripe_customer_id}) exists in <strong>live mode</strong>, 
                    but you're currently using <strong>test mode</strong> keys.
                  </p>
                  <p className="text-yellow-800 text-sm mt-2">
                    To fix this, update your <code className="bg-yellow-200 px-1 rounded">STRIPE_SECRET_KEY</code> environment variable 
                    to use a live mode key (starts with <code className="bg-yellow-200 px-1 rounded">sk_live_</code>).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

