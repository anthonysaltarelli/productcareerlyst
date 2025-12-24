'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Check, ArrowLeft, Loader2, Tag, ChevronDown, ChevronUp, X, AlertCircle, CheckCircle } from 'lucide-react';
import { TrackedButton } from '@/app/components/TrackedButton';
import { trackEvent } from '@/lib/amplitude/client';
import { createClient } from '@/lib/supabase/client';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';

// Type for coupon details
interface CouponDetails {
  couponId: string;
  couponName?: string;
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration?: string;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

const plans = {
  learn: {
    name: 'Learn',
    monthly: { price: 12 },
    quarterly: { price: 27, savings: '25%' },
    yearly: { price: 84, savings: '42%' },
  },
  accelerate: {
    name: 'Accelerate',
    monthly: { price: 20 },
    quarterly: { price: 48, savings: '20%' },
    yearly: { price: 144, savings: '40%' },
  },
};

const billingLabels = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const PaymentFormContent = ({ 
  plan, 
  billingCadence, 
  onSuccess,
  clientSecret,
  couponCode
}: { 
  plan: 'learn' | 'accelerate';
  billingCadence: 'monthly' | 'quarterly' | 'yearly';
  onSuccess: () => void;
  clientSecret: string;
  couponCode: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    // Track form submission
    trackEvent('User Submitted Payment Form', {
      'Button Section': 'Payment Form Section',
      'Button Position': 'Bottom of payment form',
      'Button Text': 'Complete Subscription',
      'Plan Selected': plan,
      'Billing Cadence Selected': billingCadence,
      'Price': plans[plan][billingCadence].price,
      'Form Validation Status': 'valid',
      'Payment Method Type': 'card',
      'Has Coupon': !!couponCode,
      'Coupon Code': couponCode || null,
    });

    setLoading(true);
    setError(null);

    try {
      // Submit payment method
      const { error: submitError } = await elements.submit();

      if (submitError) {
        trackEvent('Payment Form Error', {
          'Error Type': 'payment_submission_failed',
          'Error Message': submitError.message || 'Payment submission failed',
          'Plan Selected': plan,
          'Billing Cadence Selected': billingCadence,
          'Form Step': 'payment_form',
        });
        setError(submitError.message || 'Payment submission failed');
        setLoading(false);
        return;
      }

      // Confirm the setup intent to get the payment method
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        redirect: 'if_required',
      });

      if (confirmError) {
        trackEvent('Payment Form Error', {
          'Error Type': 'payment_confirmation_failed',
          'Error Message': confirmError.message || 'Payment confirmation failed',
          'Plan Selected': plan,
          'Billing Cadence Selected': billingCadence,
          'Form Step': 'payment_form',
        });
        setError(confirmError.message || 'Payment confirmation failed');
        setLoading(false);
        return;
      }

      if (!setupIntent || !setupIntent.payment_method) {
        trackEvent('Payment Form Error', {
          'Error Type': 'no_payment_method',
          'Error Message': 'No payment method returned',
          'Plan Selected': plan,
          'Billing Cadence Selected': billingCadence,
          'Form Step': 'payment_form',
        });
        setError('No payment method returned');
        setLoading(false);
        return;
      }

      const paymentMethodId = typeof setupIntent.payment_method === 'string' 
        ? setupIntent.payment_method 
        : setupIntent.payment_method.id;

      // Create subscription with payment method
      const requestBody: {
        plan: string;
        billingCadence: string;
        paymentMethodId: string;
        couponCode?: string;
      } = {
        plan,
        billingCadence,
        paymentMethodId,
      };
      
      // Include coupon code if provided
      if (couponCode && couponCode.trim()) {
        requestBody.couponCode = couponCode.trim();
      }

      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        trackEvent('Payment Form Error', {
          'Error Type': 'stripe_error',
          'Error Message': data.error || 'Failed to create subscription',
          'Plan Selected': plan,
          'Billing Cadence Selected': billingCadence,
          'Form Step': 'payment_form',
        });
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Track success
      trackEvent('Payment Form Success', {
        'Plan Selected': plan,
        'Billing Cadence Selected': billingCadence,
        'Price': plans[plan][billingCadence].price,
        'Payment Method ID': paymentMethodId,
        'Setup Intent Status': setupIntent.status,
        'Subscription Created': true,
        'Has Coupon': !!couponCode,
        'Coupon Code': couponCode || null,
      });

      // Success - subscription created
      onSuccess();
    } catch (err) {
      trackEvent('Payment Form Error', {
        'Error Type': 'stripe_error',
        'Error Message': err instanceof Error ? err.message : 'An error occurred',
        'Plan Selected': plan,
        'Billing Cadence Selected': billingCadence,
        'Form Step': 'payment_form',
      });
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        onClick={() => {
          trackEvent('User Submitted Payment Form', {
            'Button Section': 'Payment Form Section',
            'Button Position': 'Bottom of payment form',
            'Button Text': 'Complete Subscription',
            'Plan Selected': plan,
            'Billing Cadence Selected': billingCadence,
            'Price': plans[plan][billingCadence].price,
            'Form Validation Status': 'valid',
            'Payment Method Type': 'card',
          });
        }}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          'Complete Subscription'
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Secure payment powered by Stripe. Cancel anytime.
      </p>
    </form>
  );
};

export default function SelectBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get URL parameters first, before using them in useState
  const plan = searchParams.get('plan') as 'learn' | 'accelerate' | null;
  const billingFromUrl = searchParams.get('billing') as 'monthly' | 'quarterly' | 'yearly' | null;
  
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'quarterly' | 'yearly'>(
    billingFromUrl || 'yearly'
  );
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingClientSecret, setLoadingClientSecret] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
  const [pageTracked, setPageTracked] = useState(false);
  
  // Coupon code state
  const [couponCode, setCouponCode] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDetails | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const autoContinuedRef = useRef(false);
  
  // Helper function to calculate discounted price
  const calculateDiscountedPrice = (originalPrice: number): number => {
    if (!appliedCoupon) return originalPrice;
    
    if (appliedCoupon.percentOff) {
      return Math.round(originalPrice * (1 - appliedCoupon.percentOff / 100));
    }
    if (appliedCoupon.amountOff) {
      // Convert cents to dollars for comparison
      const amountOffDollars = appliedCoupon.amountOff / 100;
      return Math.max(0, originalPrice - amountOffDollars);
    }
    return originalPrice;
  };
  
  // Handle coupon code validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setValidatingCoupon(true);
    setCouponError(null);
    
    try {
      const response = await fetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: couponCode.trim() }),
      });
      
      const data = await response.json();
      
      // Check for HTTP errors first
      if (!response.ok) {
        setCouponError(data.error || 'Failed to validate coupon');
        setAppliedCoupon(null);
        trackEvent('Coupon Code Validation Failed', {
          'Coupon Code': couponCode.trim(),
          'Error': data.error || 'HTTP error',
          'Page': 'Select Billing Page',
        });
        return;
      }
      
      // Check if coupon is valid (API returns 200 with valid: false for invalid coupons)
      if (!data.valid) {
        setCouponError(data.error || 'Invalid coupon code');
        setAppliedCoupon(null);
        trackEvent('Coupon Code Validation Failed', {
          'Coupon Code': couponCode.trim(),
          'Error': data.error || 'Invalid coupon code',
          'Page': 'Select Billing Page',
        });
        return;
      }
      
      // Coupon is valid - use data.coupon for the details
      setAppliedCoupon({
        couponId: data.coupon.id,
        couponName: data.coupon.name,
        percentOff: data.coupon.percentOff,
        amountOff: data.coupon.amountOff,
        currency: data.coupon.currency,
        duration: data.coupon.duration,
      });
      setCouponError(null);
      
      trackEvent('Coupon Code Validation Success', {
        'Coupon Code': couponCode.trim(),
        'Coupon ID': data.coupon.id,
        'Percent Off': data.coupon.percentOff,
        'Amount Off': data.coupon.amountOff,
        'Duration': data.coupon.duration,
        'Page': 'Select Billing Page',
      });
    } catch (error) {
      setCouponError('Failed to validate coupon. Please try again.');
      setAppliedCoupon(null);
      trackEvent('Coupon Code Validation Error', {
        'Coupon Code': couponCode.trim(),
        'Error': 'Network error',
        'Page': 'Select Billing Page',
      });
    } finally {
      setValidatingCoupon(false);
    }
  };
  
  // Clear coupon
  const handleClearCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Fetch subscription and user data for tracking
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAccountCreatedAt(user.created_at);
          
          // Subscription will be null for users selecting a plan (they don't have one yet)
          setSubscription(null);
        }
      } catch (error) {
        // Silently fail
      }
    };
    fetchUserData();
  }, []);

  // Track page view
  useEffect(() => {
    if (!plan || pageTracked) return;
    
    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/dashboard/billing/select-billing';
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    let referrerDomain: string | null = null;
    if (referrer) {
      try {
        referrerDomain = new URL(referrer).hostname;
      } catch {
        referrerDomain = null;
      }
    }

    trackEvent('User Viewed Select Billing Page', {
      'Page Route': pageRoute,
      'Plan Selected': plan,
      'User State': subscription ? 'active_subscriber' : 'no_subscription',
      'Current Plan': subscription?.plan || null,
      'Referrer URL': referrer || 'None',
      'Referrer Domain': referrerDomain || 'None',
    });
    setPageTracked(true);
  }, [plan, subscription, pageTracked]);

  useEffect(() => {
    if (!plan) {
      router.push('/dashboard/billing');
      return;
    }
  }, [plan, router]);

  // Update selectedBilling when URL parameter changes
  useEffect(() => {
    if (billingFromUrl && ['monthly', 'quarterly', 'yearly'].includes(billingFromUrl)) {
      setSelectedBilling(billingFromUrl);
    }
  }, [billingFromUrl]);

  if (!plan) {
    return null;
  }

  const planData = plans[plan];
  const price = planData[selectedBilling].price;
  const monthlyEquivalent =
    selectedBilling === 'monthly'
      ? price
      : selectedBilling === 'quarterly'
        ? price / 3
        : price / 12;

  const handleContinue = async () => {
    const planData = plans[plan!];
    const billingData = planData[selectedBilling];
    const monthlyEquivalent =
      selectedBilling === 'monthly'
        ? billingData.price
        : selectedBilling === 'quarterly'
          ? billingData.price / 3
          : billingData.price / 12;

    trackEvent('User Clicked Continue to Payment Button', {
      'Button Section': 'Billing Cycle Selection Section',
      'Button Position': 'Bottom center of page',
      'Button Text': 'Continue to Payment',
      'Plan Selected': plan!,
      'Billing Cycle Selected': selectedBilling,
      'Price': billingData.price,
      'Discounted Price': appliedCoupon ? calculateDiscountedPrice(billingData.price) : billingData.price,
      'Monthly Equivalent': monthlyEquivalent,
      'Savings Percentage': 'savings' in billingData ? billingData.savings : null,
      'Has Coupon': !!appliedCoupon,
      'Coupon Code': appliedCoupon ? couponCode : null,
    });

    setShowPaymentForm(true);
    setLoadingClientSecret(true);
    
    // Track payment form view
    trackEvent('User Viewed Payment Form', {
      'Page Route': typeof window !== 'undefined' ? window.location.pathname : '/dashboard/billing/select-billing',
      'Form Step': 'payment_form',
      'Plan Selected': plan!,
      'Billing Cadence Selected': selectedBilling,
      'Price': billingData.price,
      'Order Summary Visible': true,
      'Payment Form Loaded': false,
    });
    
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan!,
          billingCadence: selectedBilling,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create payment intent');
      }

      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);
      
      // Track payment form loaded
      trackEvent('User Viewed Payment Form', {
        'Page Route': typeof window !== 'undefined' ? window.location.pathname : '/dashboard/billing/select-billing',
        'Form Step': 'payment_form',
        'Plan Selected': plan!,
        'Billing Cadence Selected': selectedBilling,
        'Price': billingData.price,
        'Order Summary Visible': true,
        'Payment Form Loaded': true,
      });
    } catch (err) {
      console.error('Error creating payment intent:', err);
      // Still show form, error will be handled in CheckoutForm
    } finally {
      setLoadingClientSecret(false);
    }
  };

  // Auto-show payment form if both plan and billing are provided in URL (skip billing selection step)
  useEffect(() => {
    if (plan && billingFromUrl && ['monthly', 'quarterly', 'yearly'].includes(billingFromUrl) && !showPaymentForm && !loadingClientSecret && !clientSecret && !autoContinuedRef.current) {
      autoContinuedRef.current = true; // Mark as auto-continued to prevent multiple runs
      
      // Automatically proceed to payment form when coming from trial upgrade
      const autoContinue = async () => {
        const planData = plans[plan];
        const billingData = planData[billingFromUrl];
        const monthlyEquivalent =
          billingFromUrl === 'monthly'
            ? billingData.price
            : billingFromUrl === 'quarterly'
              ? billingData.price / 3
              : billingData.price / 12;

        trackEvent('User Auto-Continued to Payment Form', {
          'Button Section': 'Auto-Navigation',
          'Button Position': 'Automatic',
          'Plan Selected': plan,
          'Billing Cycle Selected': billingFromUrl,
          'Price': billingData.price,
          'Monthly Equivalent': monthlyEquivalent,
          'Source': 'trial_upgrade_section',
        });

        setShowPaymentForm(true);
        setLoadingClientSecret(true);
        
        try {
          const response = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              plan: plan,
              billingCadence: billingFromUrl,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to create payment intent');
          }

          const { clientSecret: secret } = await response.json();
          setClientSecret(secret);
        } catch (err) {
          console.error('Error creating payment intent:', err);
        } finally {
          setLoadingClientSecret(false);
        }
      };

      autoContinue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, billingFromUrl]); // Only run when plan or billingFromUrl changes initially

  const handleSuccess = async () => {
    setIsProcessing(true);
    // Wait a moment for webhook to process, then redirect
    // The SuccessHandler component will also sync as a backup
    setTimeout(() => {
      router.push('/dashboard/billing?success=true');
    }, 3000);
  };

  return (
    <>
      <MobileDashboardHeader title="Select Billing" />
      <div className="min-h-screen bg-gray-50 px-4 py-6 pt-20 md:p-8 lg:p-12 md:pt-8 lg:pt-12">
        <div className="max-w-4xl mx-auto">
          <TrackedButton
            onClick={() => router.back()}
            buttonId="select-billing-page-back-button"
            eventName="User Clicked Back Button"
            eventProperties={{
              'Button Section': 'Page Header',
              'Button Position': 'Top left of page',
              'Button Text': 'Back',
              'Plan Selected': plan!,
              'Billing Cycle Selected': selectedBilling,
            }}
            className="flex items-center gap-2 text-gray-700 font-semibold mb-6 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </TrackedButton>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-4xl font-black text-gray-800 mb-2">
              {showPaymentForm ? 'Complete Your Subscription' : 'Choose Your Billing Cycle'}
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-medium">
              {showPaymentForm
                ? `Enter your payment details to start your ${planData.name} plan`
                : `Select how you'd like to be billed for the ${planData.name} plan`
              }
            </p>
          </div>

          {!showPaymentForm ? (
            <>
              {/* Promo Code Section */}
            <div className="max-w-xl mx-auto mb-8">
              <button
                type="button"
                onClick={() => setShowCouponInput(!showCouponInput)}
                className="flex items-center gap-2 text-gray-600 font-semibold hover:text-purple-600 transition-colors mx-auto"
                aria-expanded={showCouponInput}
                aria-controls="coupon-input-section"
              >
                <Tag className="w-4 h-4" />
                Have a promo code?
                {showCouponInput ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {showCouponInput && (
                <div 
                  id="coupon-input-section"
                  className="mt-4 bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError(null);
                        setAppliedCoupon(null);
                      }}
                      placeholder="Enter promo code"
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
                      aria-label="Promo code"
                      disabled={!!appliedCoupon}
                    />
                    {!appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {validatingCoupon ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleClearCoupon}
                        className="px-4 py-2.5 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-xl transition-colors flex items-center gap-1"
                        aria-label="Remove promo code"
                      >
                        <X className="w-5 h-5" />
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {validatingCoupon && (
                    <p className="mt-3 text-sm text-gray-600 font-semibold flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating promo code...
                    </p>
                  )}
                  {couponError && (
                    <p className="mt-3 text-sm text-red-600 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {couponError}
                    </p>
                  )}
                  {appliedCoupon && (
                    <p className="mt-3 text-sm text-green-600 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      Promo code "{appliedCoupon.couponName || appliedCoupon.couponId || couponCode}" applied!
                      {appliedCoupon.percentOff ? ` (${appliedCoupon.percentOff}% off)` : null}
                      {!appliedCoupon.percentOff && appliedCoupon.amountOff ? ` ($${(appliedCoupon.amountOff / 100).toFixed(2)} off)` : null}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {(['monthly', 'quarterly', 'yearly'] as const).map((billing) => {
                const billingData = planData[billing];
                const isSelected = selectedBilling === billing;
                const monthlyEquivalent =
                  billing === 'monthly'
                    ? billingData.price
                    : billing === 'quarterly'
                      ? billingData.price / 3
                      : billingData.price / 12;

                const isYearly = billing === 'yearly';

                return (
                  <button
                    key={billing}
                    onClick={() => {
                      trackEvent('User Selected Billing Cycle', {
                        'Button Section': 'Billing Cycle Selection Section',
                        'Button Position': `${billingLabels[billing]} Billing Card`,
                        'Billing Cycle Selected': billing,
                        'Plan Selected': plan!,
                        'Price': billingData.price,
                        'Monthly Equivalent': monthlyEquivalent,
                        'Savings Percentage': 'savings' in billingData ? billingData.savings : null,
                        'Card Position': billing === 'monthly' ? 'First Card' : billing === 'quarterly' ? 'Second Card' : 'Third Card',
                        'Is Yearly': isYearly,
                        'Is Most Popular Badge': isYearly,
                      });
                      setSelectedBilling(billing);
                    }}
                    className={`relative p-8 rounded-[2.5rem] border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-white ring-4 ring-purple-200 shadow-xl'
                        : 'border-gray-200 bg-white hover:border-purple-300 shadow-lg'
                    } ${isYearly ? 'ring-2 ring-purple-300' : ''}`}
                  >
                    {'savings' in billingData && billingData.savings && (
                      <div className="absolute -top-3 -right-3 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg">
                        {billingData.savings} OFF
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-black text-2xl text-gray-900">
                        {billingLabels[billing]}
                      </div>
                      {isSelected && (
                        <div className="p-2 rounded-full bg-purple-600">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-4xl font-black text-purple-600">
                        {appliedCoupon ? (
                          <>
                            <span className="text-gray-400 line-through text-2xl mr-2">
                              ${billingData.price}
                            </span>
                            ${calculateDiscountedPrice(billingData.price)}
                          </>
                        ) : (
                          `$${billingData.price}`
                        )}
                        {billing === 'monthly' && '/mo'}
                        {billing === 'quarterly' && '/3mo'}
                        {billing === 'yearly' && '/yr'}
                      </div>
                      {billing !== 'monthly' && (
                        <div className="text-lg text-gray-600 font-semibold">
                          {appliedCoupon ? (
                            <>
                              <span className="text-gray-400 line-through text-sm mr-1">
                                ${monthlyEquivalent.toFixed(0)}
                              </span>
                              ${(calculateDiscountedPrice(billingData.price) / (billing === 'quarterly' ? 3 : 12)).toFixed(0)}/mo
                            </>
                          ) : (
                            `$${monthlyEquivalent.toFixed(0)}/mo`
                          )}
                        </div>
                      )}
                      {billing === 'yearly' && (
                        <div className="pt-2 text-sm text-green-600 font-bold">
                          Best Value - Save {plan === 'learn' ? '42' : '40'}% annually
                        </div>
                      )}
                      {appliedCoupon && (
                        <div className="pt-1 text-sm text-purple-600 font-bold flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {appliedCoupon.percentOff 
                            ? `${appliedCoupon.percentOff}% off` 
                            : appliedCoupon.amountOff 
                              ? `$${(appliedCoupon.amountOff / 100).toFixed(2)} off`
                              : 'Discount applied'}
                        </div>
                      )}
                    </div>
                    {isYearly && (
                      <div className="mt-4 pt-4 border-t-2 border-gray-200">
                        <div className="flex justify-center">
                          <span className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold">
                            MOST POPULAR
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <TrackedButton
                onClick={handleContinue}
                buttonId="select-billing-page-continue-payment-button"
                eventName="User Clicked Continue to Payment Button"
                eventProperties={{
                  'Button Section': 'Billing Cycle Selection Section',
                  'Button Position': 'Bottom center of page',
                  'Button Text': 'Continue to Payment',
                  'Plan Selected': plan!,
                  'Billing Cycle Selected': selectedBilling,
                  'Price': price,
                  'Monthly Equivalent': monthlyEquivalent,
                  'Savings Percentage': 'savings' in planData[selectedBilling] ? planData[selectedBilling].savings : null,
                }}
                className="px-12 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Continue to Payment
              </TrackedButton>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b-2 border-gray-200">
                  <span className="text-gray-700 font-semibold">
                    {planData.name} Plan ({billingLabels[selectedBilling]})
                  </span>
                  <span className="text-gray-900 font-bold text-lg">
                    ${price}
                    {selectedBilling === 'monthly' && '/mo'}
                    {selectedBilling === 'quarterly' && '/3mo'}
                    {selectedBilling === 'yearly' && '/yr'}
                  </span>
                </div>
                {selectedBilling !== 'monthly' && (
                  <div className="flex justify-between items-center text-sm pb-4 border-b-2 border-gray-200">
                    <span className="text-gray-600">Monthly equivalent</span>
                    <span className="text-gray-700 font-semibold">
                      ${monthlyEquivalent.toFixed(0)}/mo
                    </span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between items-center pb-4 border-b-2 border-gray-200">
                    <span className="text-green-600 font-semibold flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Discount ({appliedCoupon.couponName || appliedCoupon.couponId || 'Promo'})
                    </span>
                    <span className="text-green-600 font-bold">
                      -{appliedCoupon.percentOff 
                        ? `${appliedCoupon.percentOff}%` 
                        : appliedCoupon.amountOff 
                          ? `$${(appliedCoupon.amountOff / 100).toFixed(2)}`
                          : 'Discount'}
                    </span>
                  </div>
                )}
                <div className="pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-bold text-xl">Total</span>
                    <div className="text-right">
                      {appliedCoupon ? (
                        <>
                          <span className="text-gray-400 line-through text-lg mr-2">
                            ${price}
                          </span>
                          <span className="text-purple-600 font-black text-2xl">
                            ${calculateDiscountedPrice(price)}
                            {selectedBilling === 'monthly' && '/mo'}
                            {selectedBilling === 'quarterly' && '/3mo'}
                            {selectedBilling === 'yearly' && '/yr'}
                          </span>
                        </>
                      ) : (
                        <span className="text-purple-600 font-black text-2xl">
                          ${price}
                          {selectedBilling === 'monthly' && '/mo'}
                          {selectedBilling === 'quarterly' && '/3mo'}
                          {selectedBilling === 'yearly' && '/yr'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Promo Code Section in Order Summary */}
              {!appliedCoupon && (
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCouponInput(!showCouponInput)}
                    className="flex items-center gap-2 text-gray-600 font-semibold hover:text-purple-600 transition-colors text-sm"
                    aria-expanded={showCouponInput}
                  >
                    <Tag className="w-4 h-4" />
                    Have a promo code?
                    {showCouponInput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {showCouponInput && (
                    <div className="mt-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError(null);
                          }}
                          placeholder="Enter promo code"
                          className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                          aria-label="Promo code"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponCode.trim()}
                          className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-sm"
                        >
                          {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {couponError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {appliedCoupon && (
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-green-600 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      {appliedCoupon.percentOff 
                        ? `${appliedCoupon.percentOff}% discount applied`
                        : appliedCoupon.amountOff 
                          ? `$${(appliedCoupon.amountOff / 100).toFixed(2)} discount applied`
                          : 'Discount applied'}
                    </p>
                    <button
                      type="button"
                      onClick={handleClearCoupon}
                      className="text-xs text-gray-500 hover:text-red-500 font-semibold transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* What's Included */}
              <div className="mt-8 pt-8 border-t-2 border-gray-200">
                <h3 className="font-bold text-lg text-gray-900 mb-4">What's Included:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">All Course Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">All Resources</span>
                  </div>
                  {plan === 'accelerate' && (
                    <>
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">Hosted Product Portfolio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 font-bold">Unlimited Everything</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="bg-white rounded-[2.5rem] shadow-lg border-2 border-gray-200 p-8">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                  <p className="text-lg font-semibold text-gray-700">Processing your subscription...</p>
                  <p className="text-sm text-gray-500 mt-2">This will just take a moment</p>
                </div>
              ) : loadingClientSecret || !clientSecret ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                  <p className="text-lg font-semibold text-gray-700">Loading payment form...</p>
                </div>
              ) : (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#9333ea',
                        colorBackground: '#ffffff',
                        colorText: '#1f2937',
                        colorDanger: '#ef4444',
                        fontFamily: 'system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '12px',
                      },
                    },
                  }}
                >
                  <PaymentFormContent 
                    plan={plan} 
                    billingCadence={selectedBilling} 
                    onSuccess={handleSuccess}
                    clientSecret={clientSecret}
                    couponCode={appliedCoupon ? couponCode : ''}
                  />
                </Elements>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
