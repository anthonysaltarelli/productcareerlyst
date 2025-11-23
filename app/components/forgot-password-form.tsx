'use client'

import { createClient } from '@/lib/supabase/client'
import { getSiteUrl } from '@/lib/utils/site-url'
import { useState } from 'react'
import { trackEvent } from '@/lib/amplitude/client'
import { TrackedLink } from '@/app/components/TrackedLink'

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const supabase = createClient()
      const siteUrl = getSiteUrl()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/update-password`,
      })

      if (error) throw error

      // Track successful password reset request
      const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/auth/forgot-password';
      trackEvent('User Requested Password Reset', {
        'Page Route': pageRoute,
        'Email': email,
      })

      setSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      
      // Track failed password reset request
      const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/auth/forgot-password';
      trackEvent('User Failed Password Reset Request', {
        'Page Route': pageRoute,
        'Error Message': errorMessage,
        'Error Type': errorMessage.toLowerCase().includes('email') ? 'Email Error' : errorMessage.toLowerCase().includes('user') ? 'User Not Found' : 'Unknown Error',
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-[1.5rem] bg-gradient-to-br from-green-200 to-emerald-200 border-2 border-green-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-green-800 font-bold text-lg">Check your email!</p>
              <p className="text-green-700 font-medium mt-1">
                We've sent you a password reset link at <span className="font-bold">{email}</span>
              </p>
            </div>
          </div>
        </div>

        <TrackedLink
          href="/auth/login"
          className="block w-full px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] font-black text-white text-center transition-all duration-200"
          eventName="User Clicked Back to Sign In Link"
          linkId="forgot-password-back-to-sign-in-link"
          eventProperties={{
            'Link Section': 'Forgot Password Form',
            'Link Position': 'Success state',
            'Link Type': 'Navigation Link',
            'Link Text': 'Back to Sign In →',
            'Link Context': 'After successful password reset email sent',
          }}
        >
          Back to Sign In →
        </TrackedLink>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-[1rem] bg-gradient-to-br from-red-200 to-orange-200 border-2 border-red-300">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      <div className="p-4 rounded-[1rem] bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200">
        <p className="text-blue-800 font-medium text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-bold text-gray-800 mb-2"
        >
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-[1rem] border-2 border-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium"
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.6)]"
      >
        {loading ? 'Sending...' : 'Send Reset Link →'}
      </button>

      <p className="text-center text-sm text-gray-600 font-medium">
        Remember your password?{' '}
        <TrackedLink
          href="/auth/login"
          className="font-bold text-purple-600 hover:text-purple-700 transition-colors"
          eventName="User Clicked Sign In Link"
          linkId="forgot-password-sign-in-link"
          eventProperties={{
            'Link Section': 'Forgot Password Form',
            'Link Position': 'Bottom of form',
            'Link Type': 'Text Link',
            'Link Text': 'Sign in',
            'Link Context': 'Below submit button',
          }}
        >
          Sign in
        </TrackedLink>
      </p>
    </form>
  )
}

