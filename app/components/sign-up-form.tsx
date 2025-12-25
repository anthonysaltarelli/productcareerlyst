'use client'

import { createClient } from '@/lib/supabase/client'
import { getSiteUrl } from '@/lib/utils/site-url'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { trackEvent, identifyUser } from '@/lib/amplitude/client'
import { TrackedLink } from '@/app/components/TrackedLink'
import { GoogleSignInButton } from '@/app/components/GoogleSignInButton'

export const SignUpForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Honeypot fields - bots will fill these, real users won't see them
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const router = useRouter()

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Honeypot check - if either field is filled, it's a bot
    if (firstName || lastName) {
      // Silently "succeed" to not tip off the bot
      router.push(`/auth/sign-up-success?email=${encodeURIComponent(email.trim())}`)
      return
    }

    try {
      const supabase = createClient()
      const siteUrl = getSiteUrl()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/confirm`,
        },
      })

      if (error) throw error

      // Explicitly identify user in Amplitude (non-blocking - fire-and-forget)
      identifyUser(email);

      // Track successful sign up (also non-blocking)
      const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/auth/sign-up';
      trackEvent('User Completed Sign Up', {
        'Page Route': pageRoute,
        'Sign Up Method': 'Email',
      });

      // Redirect immediately with email query for OTP entry
      const successUrl = `/auth/sign-up-success?email=${encodeURIComponent(email.trim())}`
      router.push(successUrl)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      
      // Track sign up error
      const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/auth/sign-up';
      trackEvent('User Failed Sign Up', {
        'Page Route': pageRoute,
        'Error Message': errorMessage,
        'Error Type': errorMessage.toLowerCase().includes('email') ? 'Email Error' : 'Unknown Error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Google Sign In */}
      <GoogleSignInButton context="sign-up" />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-purple-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gradient-to-br from-purple-200 to-pink-200 font-semibold text-gray-600">
            or continue with email
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Honeypot fields - hidden from real users, bots will fill them */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            autoComplete="off"
            tabIndex={-1}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            autoComplete="off"
            tabIndex={-1}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {error && (
          <div className="p-4 rounded-[1rem] bg-gradient-to-br from-red-200 to-orange-200 border-2 border-red-300">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

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
            className="w-full px-4 py-3 rounded-[1rem] border-2 border-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium bg-white"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-bold text-gray-800 mb-2"
          >
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-[1rem] border-2 border-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium bg-white"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={handleTogglePassword}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleTogglePassword()
                }
              }}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}
              className="text-gray-500 hover:text-purple-600 focus:outline-none transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-600 font-medium">
            Must be at least 6 characters long
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.6)]"
        >
          {loading ? 'Creating account...' : 'Create Account →'}
        </button>

        <p className="text-center text-xs text-gray-500">
          By continuing, you agree to our{' '}
          <TrackedLink
            href="/terms"
            linkId="signup-form-terms-link"
            eventName="User Clicked Terms Link"
            eventProperties={{
              'Link Section': 'Sign Up Form',
              'Link Position': 'Below Sign Up Button',
              'Link Text': 'Terms',
              'Link Type': 'Legal Link',
              'Link Context': 'Terms and Privacy Policy disclaimer',
            }}
            className="underline hover:text-purple-600 transition-colors"
          >
            Terms
          </TrackedLink>
          {' '}and{' '}
          <TrackedLink
            href="/privacy"
            linkId="signup-form-privacy-link"
            eventName="User Clicked Privacy Policy Link"
            eventProperties={{
              'Link Section': 'Sign Up Form',
              'Link Position': 'Below Sign Up Button',
              'Link Text': 'Privacy Policy',
              'Link Type': 'Legal Link',
              'Link Context': 'Terms and Privacy Policy disclaimer',
            }}
            className="underline hover:text-purple-600 transition-colors"
          >
            Privacy Policy
          </TrackedLink>
          .
        </p>

        <p className="text-center text-sm text-gray-600 font-medium">
          Already have an account?{' '}
          <a
            href="/auth/login"
            className="font-bold text-purple-600 hover:text-purple-700 transition-colors"
          >
            Sign in
          </a>
        </p>
      </form>
    </div>
  )
}
