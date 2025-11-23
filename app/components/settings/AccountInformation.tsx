'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrackedButton } from '@/app/components/TrackedButton'
import { trackEvent } from '@/lib/amplitude/client'
import { getDashboardTrackingContext } from '@/lib/utils/dashboard-tracking-context'
import type { DashboardStats } from '@/app/api/dashboard/stats/route'

interface Subscription {
  plan: 'learn' | 'accelerate' | null
  status: string | null
  isActive: boolean
}

interface FeatureFlags {
  coach?: boolean
  compensation?: boolean
  impactPortfolio?: boolean
  careerTracker?: boolean
}

interface AccountInformationProps {
  stats: DashboardStats | null
  subscription: Subscription | null
  userCreatedAt?: string | null
  featureFlags: FeatureFlags
  onPasswordChanged: () => void
}

export const AccountInformation = ({
  stats,
  subscription,
  userCreatedAt,
  featureFlags,
  onPasswordChanged,
}: AccountInformationProps) => {
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [emailSectionViewed, setEmailSectionViewed] = useState(false)
  const [passwordFormFocused, setPasswordFormFocused] = useState(false)
  const [passwordFormStartTime, setPasswordFormStartTime] = useState<number | null>(null)

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user?.email) {
          setEmail(user.email)
        }
      } catch (error) {
        console.error('Error loading email:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEmail()
  }, [])

  // Track email section view
  useEffect(() => {
    if (!loading && !emailSectionViewed) {
      setEmailSectionViewed(true)
      
      const userStateContext = getDashboardTrackingContext(
        stats,
        subscription,
        featureFlags,
        { createdAt: userCreatedAt }
      )

      // Extract email domain (privacy-safe)
      const emailDomain = email.includes('@') ? email.split('@')[1] : null

      trackEvent('User Viewed Email Section', {
        'Email Domain': emailDomain,
        'Is Email Verified': null, // Not available from client
        'Active Tab': 'account',
        'Page Route': '/dashboard/settings',
        ...userStateContext,
      })
    }
  }, [loading, emailSectionViewed, email, stats, subscription, featureFlags, userCreatedAt])

  const getUserStateContext = () => {
    return getDashboardTrackingContext(
      stats,
      subscription,
      featureFlags,
      { createdAt: userCreatedAt }
    )
  }

  const handlePasswordChange = (field: keyof typeof passwordData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handlePasswordFormFocus = () => {
    if (!passwordFormFocused) {
      setPasswordFormFocused(true)
      setPasswordFormStartTime(Date.now())

      trackEvent('User Focused Password Change Form', {
        'Active Tab': 'account',
        'Has Previously Changed Password': null, // Not easily trackable
        'Page Route': '/dashboard/settings',
        ...getUserStateContext(),
      })
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingPassword(true)
    setMessage(null)

    const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword
    const passwordMeetsMinimum = passwordData.newPassword.length >= 6
    const validationErrorType = !passwordsMatch
      ? 'passwords_dont_match'
      : !passwordMeetsMinimum
      ? 'password_too_short'
      : null

    // Track password change attempt
    trackEvent('User Attempted Password Change', {
      'New Password Length': passwordData.newPassword.length,
      'Password Meets Minimum Length': passwordMeetsMinimum,
      'Passwords Match': passwordsMatch,
      'Form Has Validation Errors': !!validationErrorType,
      'Validation Error Type': validationErrorType,
      'Active Tab': 'account',
      'Page Route': '/dashboard/settings',
      ...getUserStateContext(),
    })

    if (!passwordsMatch) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      setUpdatingPassword(false)
      return
    }

    if (!passwordMeetsMinimum) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
      setUpdatingPassword(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
        
        // Determine error type
        let errorType = 'server_error'
        if (error.message.toLowerCase().includes('weak') || error.message.toLowerCase().includes('password')) {
          errorType = 'weak_password'
        } else if (error.message.toLowerCase().includes('unauthorized') || error.message.toLowerCase().includes('auth')) {
          errorType = 'unauthorized'
        }

        trackEvent('User Failed to Change Password', {
          'Error Type': errorType,
          'Error Message': error.message,
          'New Password Length': passwordData.newPassword.length,
          'Passwords Matched': passwordsMatch,
          'Active Tab': 'account',
          'Page Route': '/dashboard/settings',
          ...getUserStateContext(),
        })
      } else {
        setMessage({ type: 'success', text: 'Password updated successfully!' })
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        onPasswordChanged()

        const timeToChange = passwordFormStartTime
          ? Math.floor((Date.now() - passwordFormStartTime) / 1000)
          : null

        trackEvent('User Successfully Changed Password', {
          'New Password Length': passwordData.newPassword.length,
          'Time to Change': timeToChange,
          'Active Tab': 'account',
          'Page Route': '/dashboard/settings',
          ...getUserStateContext(),
        })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      setMessage({ type: 'error', text: 'Failed to update password' })
      
      trackEvent('User Failed to Change Password', {
        'Error Type': 'network_error',
        'Error Message': 'Failed to update password',
        'New Password Length': passwordData.newPassword.length,
        'Passwords Matched': passwordsMatch,
        'Active Tab': 'account',
        'Page Route': '/dashboard/settings',
        ...getUserStateContext(),
      })
    } finally {
      setUpdatingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 font-semibold">Loading account information...</div>
      </div>
    )
  }

  const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword
  const passwordMeetsMinimum = passwordData.newPassword.length >= 6
  const hasValidationErrors = !passwordsMatch || !passwordMeetsMinimum

  return (
    <div>
      <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-6">
        Account Information
      </h2>
      <p className="text-gray-700 font-semibold mb-8">
        Manage your email address and password
      </p>

      {message && (
        <div
          className={`mb-6 p-4 rounded-[1rem] font-semibold ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border-2 border-green-300'
              : 'bg-red-100 text-red-800 border-2 border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Email Section */}
        <div>
          <h3 className="text-xl font-black text-gray-900 mb-4">Email Address</h3>
          <div className="bg-gray-50 rounded-[1rem] p-4 border-2 border-gray-200">
            <label
              htmlFor="email"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              disabled
              className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 bg-white font-semibold text-gray-600 cursor-not-allowed"
            />
            <p className="text-sm text-gray-600 font-semibold mt-2">
              Your email address cannot be changed here. Please contact support if you need to update your email.
            </p>
          </div>
        </div>

        {/* Password Section */}
        <div>
          <h3 className="text-xl font-black text-gray-900 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange('newPassword')}
                onFocus={handlePasswordFormFocus}
                className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange('confirmPassword')}
                onFocus={handlePasswordFormFocus}
                className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>

            <TrackedButton
              type="submit"
              disabled={updatingPassword}
              className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)]"
              eventName="User Clicked Update Password Button"
              buttonId="settings-account-update-password-button"
              eventProperties={{
                'Button Section': 'Account Information Section',
                'Button Position': 'Bottom of Password Change Form',
                'Button Text': updatingPassword ? 'Updating Password...' : 'Update Password',
                'Button Type': 'Primary Form Submit',
                'Button Context': 'Below password input fields',
                'Form Has Validation Errors': hasValidationErrors,
                'Active Tab': 'account',
                'Page Route': '/dashboard/settings',
                ...getUserStateContext(),
              }}
            >
              {updatingPassword ? 'Updating Password...' : 'Update Password'}
            </TrackedButton>
          </form>
        </div>
      </div>
    </div>
  )
}
