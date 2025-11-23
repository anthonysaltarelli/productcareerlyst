'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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

interface LogOutModalProps {
  onClose: () => void
  onConfirm: () => Promise<void>
  stats: DashboardStats | null
  subscription: Subscription | null
  userCreatedAt?: string | null
  featureFlags: FeatureFlags
  sessionStartTime: number
  tabsVisited: string[]
  profileUpdated: boolean
  passwordChanged: boolean
  modalOpenTime: number | null
}

export const LogOutModal = ({
  onClose,
  onConfirm,
  stats,
  subscription,
  userCreatedAt,
  featureFlags,
  sessionStartTime,
  tabsVisited,
  profileUpdated,
  passwordChanged,
  modalOpenTime,
}: LogOutModalProps) => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getUserStateContext = () => {
    return getDashboardTrackingContext(
      stats,
      subscription,
      featureFlags,
      { createdAt: userCreatedAt }
    )
  }

  const handleLogout = async () => {
    setLoading(true)

    const timeModalWasOpen = modalOpenTime
      ? Math.floor((Date.now() - modalOpenTime) / 1000)
      : 0
    const timeOnSettingsPage = Math.floor((Date.now() - sessionStartTime) / 1000)

    // Track confirmed logout
    trackEvent('User Confirmed Log Out', {
      'Button ID': 'settings-logout-modal-confirm-button',
      'Button Section': 'Log Out Confirmation Modal',
      'Button Position': 'Right Side of Modal Footer',
      'Button Text': loading ? 'Logging out...' : 'Log Out',
      'Button Type': 'Destructive Primary Action',
      'Button Context': 'Next to Cancel button',
      'Time Modal Was Open': timeModalWasOpen,
      'Time on Settings Page': timeOnSettingsPage,
      'Active Tab': 'logout',
      'Page Route': '/dashboard/settings',
      ...getUserStateContext(),
    })

    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      // Track successful logout before redirect
      trackEvent('User Successfully Logged Out', {
        'Logout Source': 'settings-page',
        'Time on Settings Page': timeOnSettingsPage,
        'Tabs Visited': tabsVisited,
        'Profile Updated During Session': profileUpdated,
        'Password Changed During Session': passwordChanged,
        'Page Route': '/dashboard/settings',
        ...getUserStateContext(),
      })

      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      const timeModalWasOpen = modalOpenTime
        ? Math.floor((Date.now() - modalOpenTime) / 1000)
        : 0

      trackEvent('User Cancelled Log Out', {
        'Button ID': 'settings-logout-modal-escape-key',
        'Button Section': 'Log Out Confirmation Modal',
        'Button Position': 'Keyboard Escape',
        'Button Text': 'Escape Key',
        'Button Type': 'Keyboard Action',
        'Button Context': 'Escape key pressed',
        'Time Modal Was Open': timeModalWasOpen,
        'Active Tab': 'logout',
        'Page Route': '/dashboard/settings',
        ...getUserStateContext(),
      })

      onClose()
    }
  }

  const timeModalWasOpen = modalOpenTime
    ? Math.floor((Date.now() - modalOpenTime) / 1000)
    : 0

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-[0_12px_0_0_rgba(0,0,0,0.2)] border-2 border-gray-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="logout-modal-title"
          className="text-2xl font-black bg-gradient-to-br from-red-600 to-orange-600 bg-clip-text text-transparent mb-4"
        >
          Confirm Log Out
        </h2>
        <p className="text-gray-700 font-semibold mb-8">
          Are you sure you want to log out? You'll need to sign in again to access your account.
        </p>

        <div className="flex gap-4">
          <TrackedButton
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-[1rem] bg-gray-200 hover:bg-gray-300 font-black text-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            eventName="User Cancelled Log Out"
            buttonId="settings-logout-modal-cancel-button"
            eventProperties={{
              'Button Section': 'Log Out Confirmation Modal',
              'Button Position': 'Left Side of Modal Footer',
              'Button Text': 'Cancel',
              'Button Type': 'Secondary Action',
              'Button Context': 'Next to Confirm Log Out button',
              'Time Modal Was Open': timeModalWasOpen,
              'Active Tab': 'logout',
              'Page Route': '/dashboard/settings',
              ...getUserStateContext(),
            }}
            tabIndex={0}
            aria-label="Cancel logout"
          >
            Cancel
          </TrackedButton>
          <TrackedButton
            onClick={handleLogout}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-[1rem] bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_4px_0_0_rgba(239,68,68,0.6)] border-2 border-red-600 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(239,68,68,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_0_0_rgba(239,68,68,0.6)]"
            eventName="User Confirmed Log Out"
            buttonId="settings-logout-modal-confirm-button"
            eventProperties={{
              'Button Section': 'Log Out Confirmation Modal',
              'Button Position': 'Right Side of Modal Footer',
              'Button Text': loading ? 'Logging out...' : 'Log Out',
              'Button Type': 'Destructive Primary Action',
              'Button Context': 'Next to Cancel button',
              'Time Modal Was Open': timeModalWasOpen,
              'Time on Settings Page': Math.floor((Date.now() - sessionStartTime) / 1000),
              'Active Tab': 'logout',
              'Page Route': '/dashboard/settings',
              ...getUserStateContext(),
            }}
            tabIndex={0}
            aria-label="Confirm logout"
          >
            {loading ? 'Logging out...' : 'Log Out'}
          </TrackedButton>
        </div>
      </div>
    </div>
  )
}
