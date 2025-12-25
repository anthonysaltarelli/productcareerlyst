'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { trackEvent } from '@/lib/amplitude/client'
import { createClient } from '@/lib/supabase/client'
import { getSiteUrl } from '@/lib/utils/site-url'

const otpRegex = /^\d{6}$/

export const OtpConfirmationCard = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const emailParam = searchParams.get('email')?.trim() ?? ''
  const errorParam = searchParams.get('error')?.trim() ?? null
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(errorParam)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)


  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      if (!emailParam) {
        setError('We could not detect your email. Please restart the sign up flow.')
        return
      }

      const trimmedOtp = otp.trim()
      if (!otpRegex.test(trimmedOtp)) {
        setError('Enter the 6-digit code from your email.')
        return
      }

      setError(null)
      setLoading(true)

      setTimeout(() => {
        try {
          trackEvent('User Submitted Email OTP', {
            'Page Route': '/auth/sign-up-success',
            'Entry Method': 'Email Form',
            'OTP Length': trimmedOtp.length,
          })
        } catch (trackingError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Tracking error (non-blocking):', trackingError)
          }
        }
      }, 0)

      const nextUrl = `/auth/confirm?token=${encodeURIComponent(trimmedOtp)}&type=email&email=${encodeURIComponent(
        emailParam
      )}&next=/dashboard`
      router.push(nextUrl)
    },
    [emailParam, otp, router]
  )

  const handleResend = useCallback(async () => {
    if (!emailParam) {
      setError('We could not detect your email. Please restart the sign up flow.')
      return
    }

    setResending(true)
    setResendSuccess(false)
    setError(null)

    // Track resend request (non-blocking)
    setTimeout(() => {
      try {
        trackEvent('User Requested OTP Resend', {
          'Page Route': '/auth/sign-up-success',
          'Button Section': 'Sign Up Success Page',
        })
      } catch (trackingError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Tracking error (non-blocking):', trackingError)
        }
      }
    }, 0)

    try {
      const supabase = createClient()
      const siteUrl = getSiteUrl()
      
      // Resend the OTP by calling resend() method
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailParam,
        options: {
          emailRedirectTo: `${siteUrl}/auth/confirm`,
        },
      })

      if (resendError) {
        // If resend fails, try signUp as fallback (handles case where user doesn't exist yet)
        // Note: This will work even if user already exists - Supabase will resend the OTP
        const { error: signUpError } = await supabase.auth.signUp({
          email: emailParam,
          password: '', // Empty password for OTP-only flow
          options: {
            emailRedirectTo: `${siteUrl}/auth/confirm`,
          },
        })

        if (signUpError) {
          throw signUpError
        }
      }

      setResendSuccess(true)
      // Clear success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false)
      }, 5000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code. Please try again.'
      setError(errorMessage)
      
      // Track resend error
      setTimeout(() => {
        try {
          trackEvent('User Failed OTP Resend', {
            'Page Route': '/auth/sign-up-success',
            'Error Message': errorMessage,
          })
        } catch (trackingError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Tracking error (non-blocking):', trackingError)
          }
        }
      }, 0)
    } finally {
      setResending(false)
    }
  }, [emailParam])

  const isEmailMissing = !emailParam

  return (
    <div className="p-5 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_20px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
      <div className="text-center mb-8">
        <span className="hidden sm:block text-6xl mb-6">🔐</span>
        <h1 className="text-4xl font-black bg-gradient-to-br from-green-700 to-emerald-600 bg-clip-text text-transparent mb-4">
          Enter Your Verification Code
        </h1>
        {isEmailMissing ? (
          <p className="text-gray-700 font-semibold text-lg mb-6">
            We need your email to verify the code. Please restart the sign up flow and try again.
          </p>
        ) : (
          <p className="text-gray-700 font-semibold text-lg mb-6">
            We sent a 6-digit OTP to{' '}
            <span className="font-black text-emerald-700">{emailParam}</span>. Enter it below to activate your account.
          </p>
        )}
      </div>

      <div className="hidden sm:block p-6 rounded-[1.5rem] bg-white/80 border-2 border-green-300 mb-6 text-left">
        <p className="text-gray-700 font-medium text-sm mb-4">
          <span className="font-bold">Need help?</span> Follow these steps:
        </p>
        <ol className="text-gray-800 font-semibold text-sm space-y-2">
          <li>1. Check your inbox and spam for "Product Careerlyst Verification Code".</li>
          <li>2. Copy the 6-digit code shown in the email.</li>
          <li>3. Paste it below within 10 minutes to verify.</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-bold text-gray-800 mb-2">
            Verification Code
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            value={otp}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D/g, '').slice(0, 6)
              setOtp(nextValue)
              // Clear error when user starts editing
              if (error) {
                setError(null)
              }
            }}
            disabled={isEmailMissing || loading}
            className="w-full text-center tracking-[0.6rem] text-3xl font-black px-4 py-4 rounded-[1.5rem] border-4 border-green-400 bg-white focus:outline-none focus:ring-4 focus:ring-green-200 placeholder:text-gray-400"
            placeholder="••••••"
            aria-label="6 digit verification code"
          />
        </div>

        {error && (
          <div className="p-4 rounded-[1rem] bg-gradient-to-br from-red-200 to-orange-200 border-2 border-red-300 text-left">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {resendSuccess && (
          <div className="p-4 rounded-[1rem] bg-gradient-to-br from-green-200 to-emerald-200 border-2 border-green-300 text-left">
            <p className="text-green-700 font-semibold">
              ✓ Verification code resent! Check your email.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isEmailMissing || loading || otp.length !== 6}
          className="w-full px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.6)]"
        >
          {loading ? 'Verifying...' : 'Verify & Continue →'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || isEmailMissing}
          className="text-sm font-bold text-green-700 underline hover:text-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? 'Resending...' : "Didn't get a code? Resend"}
        </button>
      </div>
    </div>
  )
}


