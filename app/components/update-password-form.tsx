'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { trackEvent } from '@/lib/amplitude/client'

export const UpdatePasswordForm = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      const errorMessage = 'Passwords do not match'
      setError(errorMessage)
      
      // Track validation error
      const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/auth/update-password';
      trackEvent('User Failed Password Update', {
        'Page Route': pageRoute,
        'Error Message': errorMessage,
        'Error Type': 'Validation Error',
      })
      return
    }

    if (password.length < 6) {
      const errorMessage = 'Password must be at least 6 characters long'
      setError(errorMessage)
      
      // Track validation error
      const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/auth/update-password';
      trackEvent('User Failed Password Update', {
        'Page Route': pageRoute,
        'Error Message': errorMessage,
        'Error Type': 'Validation Error',
      })
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      // Track successful password update
      const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/auth/update-password';
      trackEvent('User Updated Password', {
        'Page Route': pageRoute,
      })

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      
      // Track failed password update
      const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/auth/update-password';
      trackEvent('User Failed Password Update', {
        'Page Route': pageRoute,
        'Error Message': errorMessage,
        'Error Type': errorMessage.toLowerCase().includes('password') ? 'Password Error' : 'Unknown Error',
      })
    } finally {
      setLoading(false)
    }
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
          Enter your new password below. Make sure it's at least 6 characters long.
        </p>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-bold text-gray-800 mb-2"
        >
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-[1rem] border-2 border-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-bold text-gray-800 mb-2"
        >
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-[1rem] border-2 border-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_0_0_rgba(147,51,234,0.6)]"
      >
        {loading ? 'Updating...' : 'Update Password →'}
      </button>
    </form>
  )
}

