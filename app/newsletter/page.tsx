'use client';

import { useState, FormEvent } from 'react';
import { trackEvent } from '@/lib/amplitude/client';
import Link from 'next/link';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

const NewsletterPage = () => {
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrorMessage('Please enter your email');
      setSubmitState('error');
      return;
    }

    setSubmitState('loading');
    setErrorMessage('');

    // Track form submission attempt
    setTimeout(() => {
      try {
        trackEvent('User Submitted Newsletter Form', {
          'Page Route': '/newsletter',
          'Page Name': 'Newsletter',
          'Form Section': 'Main Newsletter Signup',
          'Email Entered': email.includes('@') ? 'Valid Format' : 'Invalid Format',
        });
      } catch {
        // Silently fail
      }
    }, 0);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitState('success');
        setEmail('');
        
        // Track successful subscription
        setTimeout(() => {
          try {
            trackEvent('User Subscribed Newsletter Successfully', {
              'Page Route': '/newsletter',
              'Page Name': 'Newsletter',
              'Form Section': 'Main Newsletter Signup',
            });
          } catch {
            // Silently fail
          }
        }, 0);
      } else {
        setErrorMessage(data.error || 'Something went wrong. Please try again.');
        setSubmitState('error');
        
        // Track failed subscription
        setTimeout(() => {
          try {
            trackEvent('User Newsletter Subscription Failed', {
              'Page Route': '/newsletter',
              'Page Name': 'Newsletter',
              'Error Message': data.error || 'Unknown error',
            });
          } catch {
            // Silently fail
          }
        }, 0);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
      setSubmitState('error');
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (submitState === 'error') {
      setSubmitState('idle');
      setErrorMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="hidden md:block absolute -top-8 left-[10%] w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-20 blur-2xl animate-pulse" />
      <div className="hidden md:block absolute -bottom-8 right-[10%] w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="hidden md:block absolute top-1/3 right-[5%] w-20 h-20 rounded-full bg-gradient-to-br from-purple-300 to-pink-300 opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-xl relative z-10">
        {/* Success State */}
        {submitState === 'success' ? (
          <div className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300 text-center animate-fade-in-scale">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.4)] border-2 border-green-500 flex items-center justify-center">
              <svg 
                className="w-10 h-10 sm:w-12 sm:h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-green-700 to-emerald-600 bg-clip-text text-transparent mb-3">
              You're in! 🎉
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 font-semibold mb-6">
              Welcome to the newsletter. Your first email is on the way!
            </p>
            
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.5)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.5)] text-white font-bold transition-all duration-200"
            >
              Back to home →
            </Link>
          </div>
        ) : (
          <div className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_12px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 relative overflow-hidden">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-purple-300 shadow-lg mb-5 sm:mb-6">
                <span className="text-lg">✉️</span>
                <span className="text-sm font-bold text-purple-700">Free Newsletter</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4 sm:mb-5 leading-tight">
                The only newsletter you need to{' '}
                <span className="block sm:inline">succeed in Product</span>
              </h1>
              
              <p className="text-base sm:text-lg text-gray-700 font-semibold max-w-md mx-auto">
                Weekly insights, frameworks, and strategies from a PM who's been there. No fluff. Just actionable advice.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full px-5 py-4 rounded-[1.5rem] bg-white/80 backdrop-blur-sm border-2 ${
                    submitState === 'error' 
                      ? 'border-red-400 focus:border-red-500' 
                      : 'border-purple-200 focus:border-purple-400'
                  } text-gray-800 placeholder-gray-400 font-medium text-base sm:text-lg focus:outline-none focus:ring-0 transition-colors duration-200`}
                  disabled={submitState === 'loading'}
                  aria-describedby={submitState === 'error' ? 'error-message' : undefined}
                  aria-invalid={submitState === 'error'}
                  autoComplete="email"
                />
                
                {/* Error Message */}
                {submitState === 'error' && errorMessage && (
                  <p id="error-message" className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1.5" role="alert">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errorMessage}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitState === 'loading'}
                className="w-full px-6 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.6)] disabled:opacity-70 disabled:cursor-not-allowed text-white font-black text-base sm:text-lg transition-all duration-200 flex items-center justify-center gap-2"
                aria-label="Subscribe to newsletter"
              >
                {submitState === 'loading' ? (
                  <>
                    <svg 
                      className="w-5 h-5 animate-spin" 
                      fill="none" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe for free →</span>
                  </>
                )}
              </button>
            </form>

            {/* Trust indicators */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-600 font-medium">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free forever
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No spam
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Unsubscribe anytime
              </span>
            </div>

            {/* What you'll get */}
            <div className="mt-6 pt-6 border-t-2 border-purple-300/50">
              <p className="text-sm text-gray-600 font-semibold mb-3 text-center">What you'll get:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border-2 border-purple-200 text-xs sm:text-sm text-gray-700 font-medium">
                  🎯 Interview tips
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border-2 border-pink-200 text-xs sm:text-sm text-gray-700 font-medium">
                  📈 Career strategies
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border-2 border-purple-200 text-xs sm:text-sm text-gray-700 font-medium">
                  🛠️ PM frameworks
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border-2 border-pink-200 text-xs sm:text-sm text-gray-700 font-medium">
                  💡 Industry insights
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterPage;
