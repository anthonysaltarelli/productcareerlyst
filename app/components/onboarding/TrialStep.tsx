'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CheckCircle, Loader2, AlertCircle, Sparkles, Rocket, Zap } from 'lucide-react';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/amplitude/client';
import { scoreToGrade, getGradeColor } from '@/lib/utils/gradeUtils';

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
}

const PaymentFormContent = ({
  billingCadence,
  onSuccess,
  clientSecret,
}: {
  billingCadence: 'monthly' | 'quarterly' | 'yearly';
  onSuccess: () => void;
  clientSecret: string;
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

      // Create subscription with 7-day trial
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'accelerate',
          billingCadence,
          paymentMethodId,
          trialPeriodDays: 7, // 7-day free trial
        }),
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

export const TrialStep = ({ onBack }: TrialStepProps) => {
  const router = useRouter();
  const { progress, markComplete } = useOnboardingProgress();
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [hasTrackedBillingSelection, setHasTrackedBillingSelection] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingClientSecret, setLoadingClientSecret] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisStatus, setAnalysisStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const resumeData = progress?.progress_data?.resume_upload;

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

  const handleTrialStart = useCallback(async () => {
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
      'Price': price,
      'Monthly Equivalent': Math.round(monthlyEquivalent),
      'Trial Period Days': 7,
      'Resume Analysis Available': !!analysisData,
      'Resume Score': analysisData?.overallScore || null,
      'Onboarding Completed': true,
    });

    // Redirect to dashboard
    router.push('/dashboard');
    router.refresh();
  }, [markComplete, selectedBilling, analysisData, router]);

  const price = ACCELERATE_PLAN[selectedBilling].price;
  const monthlyEquivalent =
    selectedBilling === 'monthly'
      ? price
      : selectedBilling === 'quarterly'
        ? price / 3
        : price / 12;

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
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-4">
          Start Your Free Trial
        </h2>
        <p className="text-lg text-gray-700 font-semibold">
          Get 7 days free to explore all Accelerate features. Cancel anytime.
        </p>
      </div>

      {/* Resume Analysis Results */}
      {resumeData?.versionId && (
        <div className="mb-8">
          {isLoadingAnalysis || analysisStatus === 'processing' || analysisStatus === 'pending' ? (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">
                    Analyzing Your Resume...
                  </h3>
                  <p className="text-sm text-gray-700 font-semibold">
                    This may take a few moments. We'll show your results here when ready.
                  </p>
                </div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          ) : analysisStatus === 'failed' ? (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">
                    Analysis Unavailable
                  </h3>
                  <p className="text-sm text-gray-700 font-semibold">
                    We couldn't analyze your resume at this time. You can still start your free trial!
                  </p>
                </div>
              </div>
            </div>
          ) : analysisData ? (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
              <h3 className="text-xl font-black text-gray-900 mb-4">
                Your Resume Analysis Results
              </h3>
              
              {/* Overall Score and Missing Keywords */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <div className="text-3xl font-black text-purple-600 mb-1">
                    {overallScore}
                  </div>
                  <div className="text-sm text-gray-600 font-semibold mb-2">Overall Score</div>
                  <div className={`text-xs font-bold px-2 py-1 rounded border inline-block ${getGradeColor(scoreToGrade(overallScore))}`}>
                    {scoreToGrade(overallScore)}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <div className="text-3xl font-black text-orange-600 mb-1">
                    {missingKeywordsCount}
                  </div>
                  <div className="text-sm text-gray-600 font-semibold">Missing Keywords</div>
                  {missingKeywordsCount > 0 && (
                    <div className="text-xs text-orange-600 font-semibold mt-1">
                      Add these to boost your score!
                    </div>
                  )}
                </div>
              </div>

              {/* All Category Scores */}
              {analysisData.categoryScores && (
                <div className="mb-6">
                  <h4 className="text-lg font-black text-gray-900 mb-3">Category Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(analysisData.categoryScores).map(([key, score]) => {
                      const categoryGrade = scoreToGrade(score as number);
                      const categoryColor = getGradeColor(categoryGrade);
                      const categoryName = formatCategoryName(key);
                      
                      return (
                        <div key={key} className="bg-white rounded-lg p-3 border-2 border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-700">{categoryName}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${categoryColor}`}>
                              {categoryGrade}
                            </span>
                          </div>
                          <div className="text-xl font-black text-purple-600 mb-1">
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
              <div className="bg-white rounded-xl p-4 border-2 border-purple-300">
                <p className="text-sm text-gray-800 font-semibold leading-relaxed">
                  {getEncouragingMessage(overallScore)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Accelerate Plan Preview */}
      <div className="mb-8 bg-white rounded-2xl border-2 border-purple-200 p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <Rocket className="w-8 h-8 text-pink-600" />
          <Zap className="w-8 h-8 text-orange-600" />
          <h3 className="text-2xl font-black text-gray-900">Accelerate Plan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-black text-gray-900 mb-3">Features:</h4>
            <ul className="space-y-2 text-gray-700 font-semibold">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Unlimited resume optimizations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                AI-powered resume analysis
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Contact discovery & outreach
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Company research & insights
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Custom interview questions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Product portfolio templates
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-gray-900 mb-3">Pricing:</h4>
            <div className="space-y-3">
              {(['monthly', 'quarterly', 'yearly'] as const).map((cadence) => (
                <label
                  key={cadence}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedBilling === cadence
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-gray-900">
                      {billingLabels[cadence]}
                    </div>
                    <div className="text-sm text-gray-600 font-semibold">
                      ${ACCELERATE_PLAN[cadence].price}
                      {'savings' in ACCELERATE_PLAN[cadence] && (
                        <span className="text-green-600 ml-2">
                          ({(ACCELERATE_PLAN[cadence] as { price: number; savings: string }).savings} off)
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
                          const price = ACCELERATE_PLAN[newCadence].price;
                          const monthlyEquivalent =
                            newCadence === 'monthly'
                              ? price
                              : newCadence === 'quarterly'
                                ? price / 3
                                : price / 12;
                          
                          trackEvent('User Selected Billing Cadence', {
                            'Page Route': '/onboarding',
                            'Step': 'trial',
                            'Billing Cadence': newCadence,
                            'Previous Billing Cadence': selectedBilling,
                            'Plan': 'accelerate',
                            'Price': price,
                            'Monthly Equivalent': Math.round(monthlyEquivalent),
                            'Has Savings': 'savings' in ACCELERATE_PLAN[newCadence],
                            'Savings Percentage': 'savings' in ACCELERATE_PLAN[newCadence] 
                              ? (ACCELERATE_PLAN[newCadence] as { savings: string }).savings 
                              : null,
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
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-800 font-semibold">
            <strong>Important:</strong> Free 7 day trials can only be started from this screen. After you continue, you'll need to upgrade to access premium AI-enabled features.
          </p>
        </div>

        {!showPaymentForm ? (
          <button
            onClick={() => {
              // Track payment form shown (non-blocking)
              setTimeout(() => {
                try {
                  const price = ACCELERATE_PLAN[selectedBilling].price;
                  trackEvent('User Clicked Start Trial Button', {
                    'Page Route': '/onboarding',
                    'Step': 'trial',
                    'Button Location': 'Trial Step',
                    'Button Type': 'Primary CTA',
                    'Billing Cadence': selectedBilling,
                    'Plan': 'accelerate',
                    'Price': price,
                    'Resume Analysis Available': !!analysisData,
                    'Resume Score': analysisData?.overallScore || null,
                  });
                } catch (error) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('⚠️ Tracking error (non-blocking):', error);
                  }
                }
              }, 0);
              
              setShowPaymentForm(true);
            }}
            className="w-full px-8 py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Start 7-Day Free Trial
          </button>
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
                />
              </Elements>
            ) : null}
          </div>
        )}
      </div>

      {/* Skip Option */}
      {!showPaymentForm && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              // Track trial skipped (non-blocking)
              setTimeout(() => {
                try {
                  trackEvent('User Skipped Free Trial', {
                    'Page Route': '/onboarding',
                    'Step': 'trial',
                    'Billing Cadence': selectedBilling,
                    'Plan': 'accelerate',
                    'Resume Analysis Available': !!analysisData,
                    'Resume Score': analysisData?.overallScore || null,
                    'Payment Form Shown': showPaymentForm,
                  });
                } catch (error) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('⚠️ Tracking error (non-blocking):', error);
                  }
                }
              }, 0);
              
              markComplete();
              router.push('/dashboard');
            }}
            className="px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors underline"
          >
            I don't want a free trial of the Accelerate plan
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

