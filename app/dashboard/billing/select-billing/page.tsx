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
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
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
        className="w-full py-3.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
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
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
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
            className="flex items-center gap-2 text-gray-500 font-medium mb-6 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </TrackedButton>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              {showPaymentForm ? 'Complete Your Subscription' : 'Choose Your Billing Cycle'}
            </h1>
            <p className="text-gray-500">
              {showPaymentForm
                ? `Enter your payment details to start your ${planData.name} plan`
                : `Select how you'd like to be billed for the ${planData.name} plan`
              }
            </p>
          </div>

          {!showPaymentForm ? (
            <>
              {/* Billing Options */}
              <div className="space-y-3 mb-6">
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
                  const hasSavings = 'savings' in billingData && billingData.savings;

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
                          'Savings Percentage': hasSavings ? billingData.savings : null,
                          'Card Position': billing === 'monthly' ? 'First Card' : billing === 'quarterly' ? 'Second Card' : 'Third Card',
                          'Is Yearly': isYearly,
                          'Is Most Popular Badge': isYearly,
                        });
                        setSelectedBilling(billing);
                      }}
                      className={`w-full p-4 md:px-6 md:py-5 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Left side: Radio + Content */}
                        <div className="flex items-start gap-3">
                          {/* Radio Button */}
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>

                          {/* Billing Info */}
                          <div className="text-left">
                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                              <span className="font-semibold text-gray-900">{billingLabels[billing]}</span>
                              {isYearly && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] md:text-xs font-semibold">
                                  Best Value
                                </span>
                              )}
                              {hasSavings && (
                                <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] md:text-xs font-semibold">
                                  {billingData.savings} off
                                </span>
                              )}
                            </div>
                            {billing !== 'monthly' && (
                              <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                                {appliedCoupon
                                  ? `$${(calculateDiscountedPrice(billingData.price) / (billing === 'quarterly' ? 3 : 12)).toFixed(0)}/month`
                                  : `$${monthlyEquivalent.toFixed(0)}/month`
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price - Right aligned */}
                        <div className="text-right flex-shrink-0">
                          {appliedCoupon ? (
                            <div className="flex flex-col items-end">
                              <span className="text-gray-400 line-through text-xs">
                                ${billingData.price}
                              </span>
                              <span className="font-bold text-gray-900">
                                ${calculateDiscountedPrice(billingData.price)}
                                <span className="text-gray-500 font-normal text-sm">
                                  {billing === 'monthly' && '/mo'}
                                  {billing === 'quarterly' && '/qtr'}
                                  {billing === 'yearly' && '/yr'}
                                </span>
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-gray-900">
                              ${billingData.price}
                              <span className="text-gray-500 font-normal text-sm">
                                {billing === 'monthly' && '/mo'}
                                {billing === 'quarterly' && '/qtr'}
                                {billing === 'yearly' && '/yr'}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Continue Button */}
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
                className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
              >
                Continue to Payment
              </TrackedButton>
            </>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Payment Form - Takes more space */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 order-2 lg:order-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Details</h2>
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
                    <p className="font-medium text-gray-700">Processing your subscription...</p>
                    <p className="text-sm text-gray-500 mt-1">This will just take a moment</p>
                  </div>
                ) : loadingClientSecret || !clientSecret ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
                    <p className="font-medium text-gray-700">Loading payment form...</p>
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
                          borderRadius: '8px',
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

              {/* Order Summary - Sidebar */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                  <div className="space-y-3 pb-4 border-b border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{planData.name} Plan</span>
                      <span className="font-medium text-gray-900">${price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Billing cycle</span>
                      <span className="text-gray-700">{billingLabels[selectedBilling]}</span>
                    </div>
                    {selectedBilling !== 'monthly' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Monthly equivalent</span>
                        <span className="text-gray-700">${monthlyEquivalent.toFixed(0)}/mo</span>
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Discount
                        </span>
                        <span className="text-green-600 font-medium">
                          -{appliedCoupon.percentOff
                            ? `${appliedCoupon.percentOff}%`
                            : appliedCoupon.amountOff
                              ? `$${(appliedCoupon.amountOff / 100).toFixed(2)}`
                              : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">
                        {appliedCoupon ? (
                          <>${calculateDiscountedPrice(price)}</>
                        ) : (
                          <>${price}</>
                        )}
                        <span className="text-sm font-normal text-gray-500">
                          {selectedBilling === 'monthly' && '/mo'}
                          {selectedBilling === 'quarterly' && '/quarter'}
                          {selectedBilling === 'yearly' && '/year'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Promo Code Section in Order Summary */}
                  {!appliedCoupon && (
                    <div className="py-4 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowCouponInput(!showCouponInput)}
                        className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                        aria-expanded={showCouponInput}
                      >
                        <Tag className="w-4 h-4" />
                        Add promo code
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
                              placeholder="Enter code"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
                              aria-label="Promo code"
                            />
                            <button
                              type="button"
                              onClick={handleApplyCoupon}
                              disabled={validatingCoupon || !couponCode.trim()}
                              className="px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                            </button>
                          </div>
                          {couponError && (
                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {couponError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Discount applied
                        </p>
                        <button
                          type="button"
                          onClick={handleClearCoupon}
                          className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {/* What's Included */}
                  <div className="pt-4">
                    <h3 className="font-medium text-gray-900 mb-3 text-sm">What's included:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-600">All Course Lessons</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-600">All Resources</span>
                      </div>
                      {plan === 'accelerate' && (
                        <>
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-gray-600">Product Portfolio</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">Unlimited Everything</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
