'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { trackEvent, identifyUser } from '@/lib/amplitude/client'
import { TrackedLink } from '@/app/components/TrackedLink'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Explicitly identify user in Amplitude (non-blocking - don't wait for it)
      identifyUser(email).catch(err => {
        // Silently handle errors - don't block login flow
        console.error('Failed to identify user in Amplitude:', err);
      });

      // Track successful login (also non-blocking)
      const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/auth/login';
      trackEvent('User Completed Login', {
        'Page Route': pageRoute,
        'Login Method': 'Email',
      });

      // Redirect immediately - don't wait for analytics
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      
      // Track login error
      const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/auth/login';
      trackEvent('User Failed Login', {
        'Page Route': pageRoute,
        'Error Message': errorMessage,
        'Error Type': errorMessage.toLowerCase().includes('credentials') ? 'Invalid Credentials' : 'Unknown Error',
      })
    } finally {
      setLoading(false)
    }
  }

  const isAccountNotFound = error?.toLowerCase().includes('invalid login credentials') || 
                           error?.toLowerCase().includes('user not found') ||
                           error?.toLowerCase().includes('email not found')

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-[1rem] bg-gradient-to-br from-red-200 to-orange-200 border-2 border-red-300">
          <p className="text-red-700 font-semibold mb-2">{error}</p>
          {isAccountNotFound && (
            <p className="text-sm text-gray-800 leading-relaxed">
              <span className="font-semibold">Signed up before November 22, 2025?</span> We launched a new platform!{' '}
              <TrackedLink 
                href="/auth/sign-up" 
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
                eventName="User Clicked Sign Up Link"
                linkId="login-form-create-account-link"
                eventProperties={{
                  'Link Section': 'Login Form',
                  'Link Position': 'Error message',
                  'Link Type': 'Text Link',
                  'Link Text': 'Create a new account',
                  'Link Context': 'In account not found error message',
                }}
              >
                Create a new account
              </TrackedLink>
              {' '}with the same email address. Questions? Reach out to{' '}
              <TrackedLink 
                href="mailto:team@productcareerlyst.com" 
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
                eventName="User Clicked Support Email Link"
                linkId="login-form-support-email-link"
                eventProperties={{
                  'Link Section': 'Login Form',
                  'Link Position': 'Error message',
                  'Link Type': 'Email Link',
                  'Link Text': 'team@productcareerlyst.com',
                  'Link Context': 'In account not found error message',
                }}
              >
                team@productcareerlyst.com
              </TrackedLink>
            </p>
          )}
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
          className="w-full px-4 py-3 rounded-[1rem] border-2 border-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium"
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
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-[1rem] border-2 border-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium"
          placeholder="••••••••"
        />
      </div>

      <div className="flex items-center justify-between">
        <TrackedLink
          href="/auth/forgot-password"
          className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors"
          eventName="User Clicked Forgot Password Link"
          linkId="login-form-forgot-password-link"
          eventProperties={{
            'Link Section': 'Login Form',
            'Link Position': 'Above submit button',
            'Link Type': 'Text Link',
            'Link Text': 'Forgot password?',
            'Link Context': 'Below password input field',
          }}
        >
          Forgot password?
        </TrackedLink>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.6)]"
      >
        {loading ? 'Signing in...' : 'Sign In →'}
      </button>

      <p className="text-center text-sm text-gray-600 font-medium">
        Don't have an account?{' '}
        <TrackedLink
          href="/auth/sign-up"
          className="font-bold text-purple-600 hover:text-purple-700 transition-colors"
          eventName="User Clicked Sign Up Link"
          linkId="login-form-sign-up-link"
          eventProperties={{
            'Link Section': 'Login Form',
            'Link Position': 'Bottom of form',
            'Link Type': 'Text Link',
            'Link Text': 'Sign up',
            'Link Context': 'Below submit button',
          }}
        >
          Sign up
        </TrackedLink>
      </p>
    </form>
  )
}

