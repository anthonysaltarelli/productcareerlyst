'use client';

import { useState } from 'react';
import { Subscription } from '@/lib/utils/subscription';
import { CreditCard, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BillingActionsProps {
  subscription: Subscription | null;
}

export const BillingActions = ({ subscription }: BillingActionsProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomerPortal = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to open customer portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to refresh subscription');
      }

      // Refresh the page to show updated data
      // Use window.location.reload() to ensure state resets
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRefreshing(false);
    }
  };

  if (!subscription) {
    return null;
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
      <h2 className="text-2xl font-black text-gray-900 mb-6">Manage Subscription</h2>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleCustomerPortal}
          disabled={loading || refreshing}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CreditCard className="w-5 h-5" />
          {loading ? 'Loading...' : 'Manage Billing & Payment'}
        </button>

        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Subscription Status'}
        </button>

        <p className="text-sm text-gray-600 text-center">
          Update payment method, view invoices, change plan, or cancel subscription
        </p>
      </div>
    </div>
  );
};

