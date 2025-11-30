'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CheckCircle, Loader2, AlertCircle, Sparkles, Rocket, Zap, X, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/amplitude/client';
import { scoreToGrade, getGradeColor } from '@/lib/utils/gradeUtils';
import type { PersonalizedPlan } from '@/lib/utils/planGenerator';

// Type for confirmed goals
interface ConfirmedGoal {
  id: string;
  label: string;
  target: number | null;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

const ACCELERATE_PLAN = {
  name: 'Accelerate',
  monthly: { price: 20 },
  quarterly: { price: 48, savings: '20%' },
  yearly: { price: 144, savings: '40%' },
};

const billingLabels = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

interface TrialStepProps {
  onBack: () => void;
  plan?: PersonalizedPlan | null;
  confirmedGoals?: ConfirmedGoal[];
}

const PaymentFormContent = ({
  billingCadence,
  onSuccess,
  clientSecret,
  couponCode,
}: {
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

    setLoading(true);
    setError(null);

    try {
      // Submit payment method
      const { error: submitError } = await elements.submit();

      if (submitError) {
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
        setError(confirmError.message || 'Payment confirmation failed');
        setLoading(false);
        return;
      }

      if (!setupIntent || !setupIntent.payment_method) {
        setError('No payment method returned');
        setLoading(false);
        return;
      }

      const paymentMethodId = typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method.id;

      // Create subscription with 7-day trial (and optional coupon)
      const requestBody: {
        plan: string;
        billingCadence: string;
        paymentMethodId: string;
        trialPeriodDays: number;
        couponCode?: string;
      } = {
        plan: 'accelerate',
        billingCadence,
        paymentMethodId,
        trialPeriodDays: 7, // 7-day free trial
      };

      // Add coupon code if provided
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
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Success
      onSuccess();
    } catch (err) {
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
        className="w-full px-8 py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Starting Trial...
          </span>
        ) : (
          'Start 7-Day Free Trial'
        )}
      </button>
    </form>
  );
};

export const TrialStep = ({ onBack, plan, confirmedGoals }: TrialStepProps) => {
  const router = useRouter();
  const { progress, markComplete, refresh } = useOnboardingProgress();
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [hasTrackedBillingSelection, setHasTrackedBillingSelection] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingClientSecret, setLoadingClientSecret] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisStatus, setAnalysisStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [showSkipConfirmModal, setShowSkipConfirmModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    name: string | null;
    percentOff: number | null;
    amountOff: number | null;
    currency: string | null;
    duration: string;
    durationInMonths: number | null;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const resumeData = progress?.progress_data?.resume_upload;

  // Calculate discounted price - must be defined before callbacks that use it
  const calculateDiscountedPrice = (originalPrice: number): number => {
    if (!appliedCoupon) return originalPrice;
    
    if (appliedCoupon.percentOff) {
      return Math.round(originalPrice * (1 - appliedCoupon.percentOff / 100));
    }
    
    if (appliedCoupon.amountOff) {
      // Amount off is in cents, convert to dollars
      const amountOffDollars = appliedCoupon.amountOff / 100;
      return Math.max(0, originalPrice - amountOffDollars);
    }
    
    return originalPrice;
  };

  const price = ACCELERATE_PLAN[selectedBilling].price;
  const discountedPrice = calculateDiscountedPrice(price);
  const monthlyEquivalent =
    selectedBilling === 'monthly'
      ? discountedPrice
      : selectedBilling === 'quarterly'
        ? discountedPrice / 3
        : discountedPrice / 12;

  // Refresh progress when component mounts to get latest resume data
  useEffect(() => {
    console.log('[TrialStep] Refreshing progress on mount');
    refresh();
  }, [refresh]);

  // Debug log to track resumeData
  useEffect(() => {
    console.log('[TrialStep] resumeData:', {
      hasProgress: !!progress,
      hasProgressData: !!progress?.progress_data,
      hasResumeUpload: !!resumeData,
      versionId: resumeData?.versionId,
      analysisStatus: resumeData?.analysisStatus,
    });
  }, [progress, resumeData]);

  // Track billing cadence selection (non-blocking) - only once per selection
  useEffect(() => {
    if (selectedBilling && !hasTrackedBillingSelection) {
      setTimeout(() => {
        try {
          const price = ACCELERATE_PLAN[selectedBilling].price;
          const monthlyEquivalent =
            selectedBilling === 'monthly'
              ? price
              : selectedBilling === 'quarterly'
                ? price / 3
                : price / 12;
          
          trackEvent('User Selected Billing Cadence', {
            'Page Route': '/onboarding',
            'Step': 'trial',
            'Billing Cadence': selectedBilling,
            'Plan': 'accelerate',
            'Price': price,
            'Monthly Equivalent': Math.round(monthlyEquivalent),
            'Has Savings': 'savings' in ACCELERATE_PLAN[selectedBilling],
            'Savings Percentage': 'savings' in ACCELERATE_PLAN[selectedBilling] 
              ? (ACCELERATE_PLAN[selectedBilling] as { savings: string }).savings 
              : null,
            'Resume Analysis Available': !!analysisData,
            'Resume Score': analysisData?.overallScore || null,
          });
          setHasTrackedBillingSelection(true);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Tracking error (non-blocking):', error);
          }
        }
      }, 0);
    }
  }, [selectedBilling, hasTrackedBillingSelection, analysisData]);

  // Poll for analysis results
  useEffect(() => {
    if (!resumeData?.versionId) {
      return;
    }

    let pollInterval: NodeJS.Timeout | null = null;
    let isPolling = true;

    const fetchAnalysisStatus = async () => {
      if (!isPolling) return;

      try {
        // First check the onboarding status endpoint
        const statusResponse = await fetch('/api/onboarding/resume-analysis-status');
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const currentStatus = statusData.analysisStatus || 'pending';
          setAnalysisStatus(currentStatus);

          // If completed, fetch full analysis data
          if (currentStatus === 'completed') {
            isPolling = false; // Stop polling
            if (pollInterval) {
              clearInterval(pollInterval);
            }

            // Try to get full analysis from the analyze endpoint
            const analysisResponse = await fetch(`/api/resume/versions/${resumeData.versionId}/analyze`);
            if (analysisResponse.ok) {
              const analysisResult = await analysisResponse.json();
              if (analysisResult.analysis) {
                setAnalysisData(analysisResult.analysis);
                setIsLoadingAnalysis(false);
                return;
              }
            }
            // Fallback to data from status endpoint
            if (statusData.analysisData) {
              // Transform the analysis data if needed
              const transformedData = {
                overallScore: statusData.analysisData.overall_score || statusData.analysisData.overallScore,
                categoryScores: statusData.analysisData.analysis_data?.categoryScores || statusData.analysisData.categoryScores,
                keywordAnalysis: statusData.analysisData.analysis_data?.keywordAnalysis || statusData.analysisData.keywordAnalysis,
                atsCompatibility: statusData.analysisData.analysis_data?.atsCompatibility || statusData.analysisData.atsCompatibility,
                recommendations: statusData.analysisData.analysis_data?.recommendations || statusData.analysisData.recommendations,
              };
              setAnalysisData(transformedData);
            }
            setIsLoadingAnalysis(false);
          } else if (currentStatus === 'failed') {
            isPolling = false; // Stop polling
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            setIsLoadingAnalysis(false);
          } else if (currentStatus === 'processing' || currentStatus === 'pending') {
            setIsLoadingAnalysis(true);
            // Continue polling
          }
        }
      } catch (error) {
        console.error('Error fetching analysis status:', error);
        setIsLoadingAnalysis(false);
      }
    };

    // Initial fetch
    fetchAnalysisStatus();

    // Set up polling - check every 3 seconds
    pollInterval = setInterval(() => {
      if (isPolling) {
        fetchAnalysisStatus();
      }
    }, 3000);

    return () => {
      isPolling = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [resumeData?.versionId]);

  // Create setup intent when payment form is shown
  useEffect(() => {
    if (showPaymentForm && !clientSecret) {
      const createSetupIntent = async () => {
        setLoadingClientSecret(true);
        try {
          const response = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              plan: 'accelerate',
              billingCadence: selectedBilling,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create setup intent');
          }

          const data = await response.json();
          setClientSecret(data.clientSecret);
        } catch (error) {
          toast.error('Failed to initialize payment form');
          setShowPaymentForm(false);
        } finally {
          setLoadingClientSecret(false);
        }
      };

      createSetupIntent();
    }
  }, [showPaymentForm, clientSecret, selectedBilling]);

  // Helper function to save plan and goals to database
  const completeOnboarding = useCallback(async () => {
    if (!plan) {
      console.warn('No plan available to save');
      return;
    }

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          confirmedGoals: confirmedGoals || [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Error completing onboarding:', data.error);
        // Don't throw - allow onboarding to complete even if plan save fails
      }
    } catch (error) {
      console.error('Error calling complete endpoint:', error);
      // Don't throw - allow onboarding to complete even if plan save fails
    }
  }, [plan, confirmedGoals]);

  const handleTrialStart = useCallback(async () => {
    // Save plan and goals to database first
    await completeOnboarding();

    // Mark onboarding as complete
    await markComplete();

    // Track event (non-blocking - already fire-and-forget)
    const price = ACCELERATE_PLAN[selectedBilling].price;
    const monthlyEquivalent =
      selectedBilling === 'monthly'
        ? price
        : selectedBilling === 'quarterly'
          ? price / 3
          : price / 12;
    
    trackEvent('User Started Free Trial', {
      'Page Route': '/onboarding',
      'Step': 'trial',
      'Billing Cadence': selectedBilling,
      'Plan': 'accelerate',
      'Original Price': ACCELERATE_PLAN[selectedBilling].price,
      'Discounted Price': discountedPrice,
      'Monthly Equivalent': Math.round(monthlyEquivalent),
      'Trial Period Days': 7,
      'Resume Analysis Available': !!analysisData,
      'Resume Score': analysisData?.overallScore || null,
      'Onboarding Completed': true,
      'Coupon Code': appliedCoupon?.id || null,
      'Has Coupon': !!appliedCoupon,
      'Coupon Percent Off': appliedCoupon?.percentOff || null,
      'Coupon Amount Off': appliedCoupon?.amountOff || null,
      'Coupon Duration': appliedCoupon?.duration || null,
    });

    // Redirect to dashboard
    router.push('/dashboard');
    router.refresh();
  }, [completeOnboarding, markComplete, selectedBilling, analysisData, router, appliedCoupon, discountedPrice]);

  // Handle coupon validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setValidatingCoupon(true);
    setCouponError(null);
    
    try {
      const response = await fetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ couponCode: couponCode.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setCouponError(data.error || 'Failed to validate coupon');
        setAppliedCoupon(null);
        return;
      }
      
      if (data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponError(null);
        toast.success(`Promo code "${couponCode}" applied!`);
        
        // Track coupon applied (non-blocking)
        setTimeout(() => {
          try {
            trackEvent('User Applied Coupon Code', {
              'Page Route': '/onboarding',
              'Step': 'trial',
              'Coupon Code': couponCode,
              'Coupon Valid': true,
              'Percent Off': data.coupon.percentOff,
              'Amount Off': data.coupon.amountOff,
              'Duration': data.coupon.duration,
            });
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Tracking error (non-blocking):', error);
            }
          }
        }, 0);
      } else {
        setCouponError(data.error || 'Invalid coupon code');
        setAppliedCoupon(null);
        
        // Track invalid coupon (non-blocking)
        setTimeout(() => {
          try {
            trackEvent('User Applied Coupon Code', {
              'Page Route': '/onboarding',
              'Step': 'trial',
              'Coupon Code': couponCode,
              'Coupon Valid': false,
              'Error': data.error,
            });
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Tracking error (non-blocking):', error);
            }
          }
        }, 0);
      }
    } catch (error) {
      setCouponError('Failed to validate coupon. Please try again.');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Handle removing applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  // Get encouraging message based on score
  const getEncouragingMessage = (score: number): string => {
    if (score >= 90) {
      return "🎉 Outstanding! Your resume is strong. With Accelerate, you can fine-tune it for each job application, customize keywords for ATS optimization, and keep it optimized as you grow in your career.";
    } else if (score >= 80) {
      return "✨ Great foundation! You're close to an excellent resume. Accelerate helps you customize it for each job application, add targeted keywords, and make those final touches that make recruiters take notice.";
    } else if (score >= 70) {
      return "🚀 Good start! With Accelerate's AI-powered analysis, you can identify specific improvements, customize your resume for each application, and boost your score to get more interviews.";
    } else if (score >= 60) {
      return "💪 Solid base! Accelerate will help you transform your resume with targeted improvements, customize it for each job you apply to, and add the keywords recruiters are looking for.";
    } else {
      return "📈 Ready to level up? Accelerate provides personalized recommendations to help you build a strong resume, customize it for each application, and get noticed by top companies.";
    }
  };

  // Format category name for display
  const formatCategoryName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const missingKeywordsCount = analysisData?.keywordAnalysis?.missing?.length || 0;
  const overallScore = analysisData?.overallScore || 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          Try Accelerate for Free
        </h2>
        <p className="text-base md:text-lg text-gray-700 font-semibold">
          Get 7 days free to explore all of our premium, AI-enabled features. Cancel anytime.
        </p>
      </div>

      {/* Resume Analysis Results */}
      {resumeData?.versionId && (
        <div className="mb-6 md:mb-8">
          {isLoadingAnalysis || analysisStatus === 'processing' || analysisStatus === 'pending' ? (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4 mb-4">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-blue-600 animate-spin flex-shrink-0" />
                <div>
                  <h3 className="text-lg md:text-xl font-black text-gray-900 mb-1">
                    Analyzing Your Resume...
                  </h3>
                  <p className="text-xs md:text-sm text-gray-700 font-semibold">
                    This may take a few moments. We'll show your results here when ready.
                  </p>
                </div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          ) : analysisStatus === 'failed' ? (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg md:text-xl font-black text-gray-900 mb-1">
                    Analysis Unavailable
                  </h3>
                  <p className="text-xs md:text-sm text-gray-700 font-semibold">
                    We couldn't analyze your resume at this time. You can still start your free trial!
                  </p>
                </div>
              </div>
            </div>
          ) : analysisData ? (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-3 sm:p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-black text-gray-900 mb-3 md:mb-4">
                Your Resume Analysis Results
              </h3>
              
              {/* Overall Score and Missing Keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="bg-white rounded-lg p-3 md:p-4 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <span className="text-sm md:text-base font-bold text-gray-700">Overall Score</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getGradeColor(scoreToGrade(overallScore))}`}>
                      {scoreToGrade(overallScore)}
                    </span>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-purple-600 mb-2">
                    {overallScore}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${overallScore}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 md:p-4 border-2 border-gray-200">
                  <div className="text-2xl md:text-3xl font-black text-orange-600 mb-1">
                    {missingKeywordsCount}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 font-semibold">Missing Keywords</div>
                  {missingKeywordsCount > 0 && (
                    <div className="text-xs text-orange-600 font-semibold mt-1">
                      Add these to boost your score!
                    </div>
                  )}
                </div>
              </div>

              {/* All Category Scores */}
              {analysisData.categoryScores && (
                <div className="mb-4 md:mb-6">
                  <h4 className="text-base md:text-lg font-black text-gray-900 mb-2 md:mb-3">Category Breakdown</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {Object.entries(analysisData.categoryScores).map(([key, score]) => {
                      const categoryGrade = scoreToGrade(score as number);
                      const categoryColor = getGradeColor(categoryGrade);
                      const categoryName = formatCategoryName(key);
                      
                      return (
                        <div key={key} className="bg-white rounded-lg p-2.5 md:p-3 border-2 border-gray-200">
                          <div className="flex items-center justify-between mb-1.5 md:mb-2">
                            <span className="text-xs font-bold text-gray-700">{categoryName}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${categoryColor}`}>
                              {categoryGrade}
                            </span>
                          </div>
                          <div className="text-lg md:text-xl font-black text-purple-600 mb-1">
                            {score as number}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-purple-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${score as number}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Encouraging Message */}
              <div className="bg-white rounded-xl p-3 md:p-4 border-2 border-purple-300">
                <p className="text-xs md:text-sm text-gray-800 font-semibold leading-relaxed">
                  {getEncouragingMessage(overallScore)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Accelerate Plan Preview */}
      <div className="mb-6 md:mb-8 md:bg-white md:rounded-2xl md:border-2 md:border-purple-200 md:p-8 md:shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            <Rocket className="w-6 h-6 md:w-8 md:h-8 text-pink-600" />
            <Zap className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
          </div>
          <h3 className="text-xl md:text-2xl font-black text-gray-900">Free 7 Day Accelerate Trial</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="flex flex-col">
            <h4 className="font-black text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Popular Features:</h4>
            <ul className="space-y-1.5 md:space-y-2 text-gray-700 font-semibold text-sm md:text-base">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                Unlimited resume optimizations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                AI-powered resume analysis
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                Contact discovery & outreach
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                Company research & insights
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                Custom interview questions
              </li>
            </ul>
            
            {/* Highlighted Portfolio Feature */}
            <div className="mt-3 md:mt-4 flex-1 flex items-center p-3 md:p-4 bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 border-2 border-purple-300 rounded-xl">
              <p className="text-sm md:text-base font-bold text-purple-900">
                Launch a professionally designed Product Portfolio in minutes
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-black text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Pricing:</h4>
            <div className="space-y-2 md:space-y-3">
              {(['monthly', 'quarterly', 'yearly'] as const).map((cadence) => {
                const originalPrice = ACCELERATE_PLAN[cadence].price;
                const cadenceDiscountedPrice = calculateDiscountedPrice(originalPrice);
                const originalMonthly = cadence === 'monthly' ? originalPrice : Math.round(originalPrice / (cadence === 'quarterly' ? 3 : 12));
                const discountedMonthly = cadence === 'monthly' ? cadenceDiscountedPrice : Math.round(cadenceDiscountedPrice / (cadence === 'quarterly' ? 3 : 12));
                const hasDiscount = appliedCoupon && cadenceDiscountedPrice < originalPrice;
                
                return (
                  <label
                    key={cadence}
                    className={`relative flex items-center justify-between p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedBilling === cadence
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    {cadence === 'yearly' && (
                      <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                        Most Popular
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2 flex-wrap">
                        {billingLabels[cadence]}
                        {'savings' in ACCELERATE_PLAN[cadence] && !hasDiscount && (
                          <span className="text-green-600 text-xs font-bold">
                            ({(ACCELERATE_PLAN[cadence] as { price: number; savings: string }).savings} off)
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-0.5 rounded-full">
                            {appliedCoupon?.percentOff ? `${appliedCoupon.percentOff}% off` : `$${(appliedCoupon?.amountOff || 0) / 100} off`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs md:text-sm font-semibold flex items-center gap-2 flex-wrap">
                        {hasDiscount ? (
                          <>
                            <span className="text-gray-400 line-through">${originalMonthly}/mo</span>
                            <span className="text-green-600 font-bold">${discountedMonthly}/mo</span>
                          </>
                        ) : (
                          <span className="text-gray-600">${originalMonthly}/mo</span>
                        )}
                        {cadence !== 'monthly' && (
                          <span className="text-gray-500">
                            billed {cadence === 'quarterly' ? 'quarterly' : 'annually'}
                            {hasDiscount && ` ($${cadenceDiscountedPrice})`}
                          </span>
                        )}
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="billing"
                      value={cadence}
                      checked={selectedBilling === cadence}
                      onChange={(e) => {
                        const newCadence = e.target.value as typeof selectedBilling;
                        setSelectedBilling(newCadence);
                        setHasTrackedBillingSelection(false); // Reset to track new selection
                        
                        // Track billing cadence change (non-blocking)
                        setTimeout(() => {
                          try {
                            const newPrice = ACCELERATE_PLAN[newCadence].price;
                            const newMonthlyEquivalent =
                              newCadence === 'monthly'
                                ? newPrice
                                : newCadence === 'quarterly'
                                  ? newPrice / 3
                                  : newPrice / 12;
                            
                            trackEvent('User Selected Billing Cadence', {
                              'Page Route': '/onboarding',
                              'Step': 'trial',
                              'Billing Cadence': newCadence,
                              'Previous Billing Cadence': selectedBilling,
                              'Plan': 'accelerate',
                              'Price': newPrice,
                              'Monthly Equivalent': Math.round(newMonthlyEquivalent),
                              'Has Savings': 'savings' in ACCELERATE_PLAN[newCadence],
                              'Savings Percentage': 'savings' in ACCELERATE_PLAN[newCadence] 
                                ? (ACCELERATE_PLAN[newCadence] as { savings: string }).savings 
                                : null,
                              'Resume Analysis Available': !!analysisData,
                              'Resume Score': analysisData?.overallScore || null,
                              'Applied Coupon': appliedCoupon?.id || null,
                            });
                          } catch (error) {
                            if (process.env.NODE_ENV === 'development') {
                              console.warn('⚠️ Tracking error (non-blocking):', error);
                            }
                          }
                        }, 0);
                      }}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coupon Code Input */}
        <div className="mb-4 md:mb-6">
          {appliedCoupon ? (
            // Show applied coupon state
            <div className="p-3 md:p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-700">
                      Promo code applied!
                    </p>
                    <p className="text-xs text-green-600 font-semibold">
                      {appliedCoupon.percentOff 
                        ? `${appliedCoupon.percentOff}% off ${appliedCoupon.duration === 'forever' ? 'forever' : appliedCoupon.duration === 'once' ? 'first payment' : `for ${appliedCoupon.durationInMonths} months`}`
                        : `$${(appliedCoupon.amountOff || 0) / 100} off ${appliedCoupon.duration === 'forever' ? 'forever' : appliedCoupon.duration === 'once' ? 'first payment' : `for ${appliedCoupon.durationInMonths} months`}`
                      }
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  aria-label="Remove promo code"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            // Show coupon input
            <>
              <button
                type="button"
                onClick={() => setShowCouponInput(!showCouponInput)}
                className="flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                aria-expanded={showCouponInput}
                aria-label="Toggle coupon code input"
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
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError(null); // Clear error when typing
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="Enter promo code"
                      disabled={validatingCoupon}
                      className={`flex-1 px-4 py-2.5 border-2 rounded-xl font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none transition-colors ${
                        couponError 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-200 focus:border-purple-500'
                      } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                      aria-label="Promo code"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || validatingCoupon}
                      className="px-4 md:px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      aria-label="Apply promo code"
                    >
                      {validatingCoupon ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden md:inline">Checking...</span>
                        </>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                  
                  {/* Error state */}
                  {couponError && (
                    <div className="mt-2 flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <p className="text-xs font-semibold">{couponError}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {!showPaymentForm ? (
          <>
          <button
            onClick={() => {
              // Track payment form shown (non-blocking)
              setTimeout(() => {
                try {
                  trackEvent('User Clicked Start Trial Button', {
                    'Page Route': '/onboarding',
                    'Step': 'trial',
                    'Button Location': 'Trial Step',
                    'Button Type': 'Primary CTA',
                    'Billing Cadence': selectedBilling,
                    'Plan': 'accelerate',
                    'Original Price': ACCELERATE_PLAN[selectedBilling].price,
                    'Discounted Price': discountedPrice,
                    'Resume Analysis Available': !!analysisData,
                    'Resume Score': analysisData?.overallScore || null,
                    'Coupon Code': appliedCoupon?.id || null,
                    'Has Coupon': !!appliedCoupon,
                  });
                } catch (error) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('⚠️ Tracking error (non-blocking):', error);
                  }
                }
              }, 0);
              
              setShowPaymentForm(true);
            }}
            className="w-full px-6 md:px-8 py-3 md:py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all text-sm md:text-base"
          >
            Start 7-Day Free Trial
          </button>
          <p className="text-xs md:text-sm text-gray-500 mt-2 text-center">
            You will not be charged today. Switch plans or cancel any time before December 3.
          </p>
        </>
        ) : (
          <div className="space-y-4">
            {loadingClientSecret ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                  },
                }}
              >
                <PaymentFormContent
                  billingCadence={selectedBilling}
                  onSuccess={handleTrialStart}
                  clientSecret={clientSecret}
                  couponCode={appliedCoupon?.id || ''}
                />
              </Elements>
            ) : null}
          </div>
        )}
      </div>

      {/* Skip Option */}
      <div className="mt-4 md:mt-6 text-center">
        <button
          onClick={() => setShowSkipConfirmModal(true)}
          className="px-4 md:px-6 py-2 md:py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors underline text-sm md:text-base"
        >
          I don't want a free trial of the Accelerate plan
        </button>
      </div>

      {/* Skip Confirmation Modal */}
      {showSkipConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowSkipConfirmModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal content */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">
                Are you sure?
              </h3>
              <p className="text-gray-700 font-semibold mb-4">
                You can only start a free trial from this screen.
              </p>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-left">
                <p className="text-purple-900 font-semibold text-sm">
                  With the free trial, you get <strong>full access</strong> to all AI-enabled features on the Accelerate plan, including launching a Product Portfolio, until{' '}
                  <strong>Wednesday, December 3</strong>.
                </p>
              </div>
            </div>

            {/* Modal actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSkipConfirmModal(false);
                  setShowPaymentForm(true);
                  
                  // Track user chose to try free trial from modal (non-blocking)
                  setTimeout(() => {
                    try {
                      trackEvent('User Chose Free Trial From Modal', {
                        'Page Route': '/onboarding',
                        'Step': 'trial',
                        'Billing Cadence': selectedBilling,
                        'Plan': 'accelerate',
                        'Resume Analysis Available': !!analysisData,
                        'Resume Score': analysisData?.overallScore || null,
                      });
                    } catch (error) {
                      if (process.env.NODE_ENV === 'development') {
                        console.warn('⚠️ Tracking error (non-blocking):', error);
                      }
                    }
                  }, 0);
                }}
                className="w-full px-6 py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
              >
                Try for Free
              </button>
              <button
                onClick={async () => {
                  // Track trial skipped after confirmation (non-blocking)
                  setTimeout(() => {
                    try {
                      trackEvent('User Skipped Free Trial', {
                        'Page Route': '/onboarding',
                        'Step': 'trial',
                        'Billing Cadence': selectedBilling,
                        'Plan': 'accelerate',
                        'Resume Analysis Available': !!analysisData,
                        'Resume Score': analysisData?.overallScore || null,
                        'Confirmed Skip': true,
                      });
                    } catch (error) {
                      if (process.env.NODE_ENV === 'development') {
                        console.warn('⚠️ Tracking error (non-blocking):', error);
                      }
                    }
                  }, 0);

                  setShowSkipConfirmModal(false);

                  // Save plan and goals to database first
                  await completeOnboarding();

                  // CRITICAL: Must await markComplete before navigating
                  // Otherwise the is_complete flag won't be saved to the database
                  try {
                    await markComplete();
                  } catch (error) {
                    console.error('Error marking onboarding complete:', error);
                    // Continue to dashboard even if this fails
                  }

                  router.push('/dashboard');
                  router.refresh();
                }}
                className="w-full px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors"
              >
                I don't want a free trial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 md:mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 md:px-6 py-2 md:py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors text-sm md:text-base"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

