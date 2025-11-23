'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutFlow } from '@/app/components/billing/CheckoutFlow';
import { trackEvent } from '@/lib/amplitude/client';
import { createClient } from '@/lib/supabase/client';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  const plan = searchParams.get('plan') as 'learn' | 'accelerate' | null;
  const billingCadence = searchParams.get('billing') as 'monthly' | 'quarterly' | 'yearly' | null;
  const [pageTracked, setPageTracked] = useState(false);

  useEffect(() => {
    if (!plan || !billingCadence) {
      router.push('/dashboard/billing/plans');
      return;
    }
    setLoading(false);
  }, [plan, billingCadence, router]);

  // Track page view
  useEffect(() => {
    if (!plan || !billingCadence || pageTracked || loading) return;

    const prices = {
      learn: { monthly: 12, quarterly: 27, yearly: 84 },
      accelerate: { monthly: 20, quarterly: 48, yearly: 144 },
    };
    const price = prices[plan][billingCadence];
    const monthlyEquivalent =
      billingCadence === 'monthly'
        ? price
        : billingCadence === 'quarterly'
          ? price / 3
          : price / 12;

    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/dashboard/billing/checkout';
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    let referrerDomain: string | null = null;
    if (referrer) {
      try {
        referrerDomain = new URL(referrer).hostname;
      } catch {
        referrerDomain = null;
      }
    }

    trackEvent('User Viewed Checkout Page', {
      'Page Route': pageRoute,
      'Plan Selected': plan,
      'Billing Cadence': billingCadence,
      'Price': price,
      'Monthly Equivalent': monthlyEquivalent,
      'User State': 'no_subscription',
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
    });
    setPageTracked(true);
  }, [plan, billingCadence, pageTracked, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <CheckoutFlow plan={plan!} billingCadence={billingCadence!} />
      </div>
    </div>
  );
}

