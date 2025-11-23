'use client'

import { useState, useEffect } from 'react'
import { LogOutModal } from './LogOutModal'
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

interface LogOutSectionProps {
  stats: DashboardStats | null
  subscription: Subscription | null
  userCreatedAt?: string | null
  featureFlags: FeatureFlags
  sessionStartTime: number
  tabsVisited: string[]
  profileUpdated: boolean
  passwordChanged: boolean
}

export const LogOutSection = ({
  stats,
  subscription,
  userCreatedAt,
  featureFlags,
  sessionStartTime,
  tabsVisited,
  profileUpdated,
  passwordChanged,
}: LogOutSectionProps) => {
  const [showModal, setShowModal] = useState(false)
  const [modalOpenTime, setModalOpenTime] = useState<number | null>(null)

  const getUserStateContext = () => {
    return getDashboardTrackingContext(
      stats,
      subscription,
      featureFlags,
      { createdAt: userCreatedAt }
    )
  }

  const handleOpenModal = () => {
    setShowModal(true)
    setModalOpenTime(Date.now())

    const timeOnSettingsPage = Math.floor((Date.now() - sessionStartTime) / 1000)

    trackEvent('User Clicked Log Out Button', {
      'Button ID': 'settings-logout-primary-button',
      'Button Section': 'Log Out Section',
      'Button Position': 'Center of Log Out Card',
      'Button Text': 'Log Out',
      'Button Type': 'Destructive Action',
      'Button Context': 'Inside red warning card',
      'Active Tab': 'logout',
      'Time on Settings Page': timeOnSettingsPage,
      'Tabs Visited': tabsVisited,
      'Profile Updated During Session': profileUpdated,
      'Password Changed During Session': passwordChanged,
      'Page Route': '/dashboard/settings',
      ...getUserStateContext(),
    })
  }

  useEffect(() => {
    if (showModal && modalOpenTime) {
      trackEvent('User Viewed Log Out Confirmation Modal', {
        'Modal Trigger': 'settings-logout-primary-button',
        'Active Tab': 'logout',
        'Time on Settings Page': Math.floor((Date.now() - sessionStartTime) / 1000),
        'Page Route': '/dashboard/settings',
        ...getUserStateContext(),
      })
    }
  }, [showModal, modalOpenTime, sessionStartTime, stats, subscription, featureFlags, userCreatedAt])

  return (
    <div>
      <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-6">
        Log Out
      </h2>
      <p className="text-gray-700 font-semibold mb-8">
        Sign out of your account
      </p>

      <div className="bg-red-50 rounded-[1.5rem] p-8 border-2 border-red-200">
        <p className="text-gray-800 font-semibold mb-6">
          Are you sure you want to log out? You'll need to sign in again to access your account.
        </p>
        <TrackedButton
          onClick={handleOpenModal}
          className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_6px_0_0_rgba(239,68,68,0.6)] border-2 border-red-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(239,68,68,0.6)] font-black text-white transition-all duration-200"
          eventName="User Clicked Log Out Button"
          buttonId="settings-logout-primary-button"
          eventProperties={{
            'Button Section': 'Log Out Section',
            'Button Position': 'Center of Log Out Card',
            'Button Text': 'Log Out',
            'Button Type': 'Destructive Action',
            'Button Context': 'Inside red warning card',
            'Active Tab': 'logout',
            'Time on Settings Page': Math.floor((Date.now() - sessionStartTime) / 1000),
            'Tabs Visited': tabsVisited,
            'Profile Updated During Session': profileUpdated,
            'Password Changed During Session': passwordChanged,
            'Page Route': '/dashboard/settings',
            ...getUserStateContext(),
          }}
          tabIndex={0}
          aria-label="Open logout confirmation modal"
        >
          Log Out
        </TrackedButton>
      </div>

      {showModal && modalOpenTime && (
        <LogOutModal
          onClose={() => {
            const timeModalWasOpen = modalOpenTime
              ? Math.floor((Date.now() - modalOpenTime) / 1000)
              : 0

            trackEvent('User Cancelled Log Out', {
              'Button ID': 'settings-logout-modal-cancel-button',
              'Button Section': 'Log Out Confirmation Modal',
              'Button Position': 'Left Side of Modal Footer',
              'Button Text': 'Cancel',
              'Button Type': 'Secondary Action',
              'Button Context': 'Next to Confirm Log Out button',
              'Time Modal Was Open': timeModalWasOpen,
              'Active Tab': 'logout',
              'Page Route': '/dashboard/settings',
              ...getUserStateContext(),
            })

            setShowModal(false)
            setModalOpenTime(null)
          }}
          onConfirm={async () => {
            // This is handled inside LogOutModal
          }}
          stats={stats}
          subscription={subscription}
          userCreatedAt={userCreatedAt}
          featureFlags={featureFlags}
          sessionStartTime={sessionStartTime}
          tabsVisited={tabsVisited}
          profileUpdated={profileUpdated}
          passwordChanged={passwordChanged}
          modalOpenTime={modalOpenTime}
        />
      )}
    </div>
  )
}
