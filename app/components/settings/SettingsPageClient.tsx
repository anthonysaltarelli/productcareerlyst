'use client'

import { useState, useEffect, useRef } from 'react'
import { ProfileInformation } from '@/app/components/settings/ProfileInformation'
import { AccountInformation } from '@/app/components/settings/AccountInformation'
import { LogOutSection } from '@/app/components/settings/LogOutSection'
import { TrackedButton } from '@/app/components/TrackedButton'
import { trackEvent } from '@/lib/amplitude/client'
import { getDashboardTrackingContext } from '@/lib/utils/dashboard-tracking-context'
import type { DashboardStats } from '@/app/api/dashboard/stats/route'
import { useFlags } from 'launchdarkly-react-client-sdk'

type SettingsTab = 'profile' | 'account' | 'logout'

interface Subscription {
  plan: 'learn' | 'accelerate' | null
  status: string | null
  isActive: boolean
}

interface SettingsPageClientProps {
  stats: DashboardStats | null
  subscription: Subscription | null
  userCreatedAt?: string | null
  initialActiveTab?: SettingsTab
}

export const SettingsPageClient = ({
  stats,
  subscription,
  userCreatedAt,
  initialActiveTab = 'profile',
}: SettingsPageClientProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialActiveTab)
  const [previousTab, setPreviousTab] = useState<SettingsTab | null>(null)
  const [tabStartTime, setTabStartTime] = useState<Record<SettingsTab, number>>({
    profile: Date.now(),
    account: 0,
    logout: 0,
  })
  const [tabsVisited, setTabsVisited] = useState<SettingsTab[]>(['profile'])
  const [sessionStartTime] = useState(Date.now())
  const [profileUpdated, setProfileUpdated] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const { coach, compensation, impactPortfolio, careerTracker } = useFlags()
  const hasTrackedPageLeave = useRef(false)

  const featureFlags = {
    coach,
    compensation,
    impactPortfolio,
    careerTracker,
  }

  // Track tab switches
  const handleTabChange = (newTab: SettingsTab) => {
    if (newTab === activeTab) return

    const currentTime = Date.now()
    const timeSpent = previousTab && tabStartTime[previousTab] > 0
      ? Math.floor((currentTime - tabStartTime[previousTab]) / 1000)
      : 0

    // Track tab switch
    const userStateContext = getDashboardTrackingContext(
      stats,
      subscription,
      featureFlags,
      { createdAt: userCreatedAt }
    )

    trackEvent('User Switched Settings Tab', {
      'From Tab': activeTab,
      'To Tab': newTab,
      'Time Spent on Previous Tab': timeSpent,
      'Page Route': '/dashboard/settings',
      ...userStateContext,
    })

    // Update state
    setPreviousTab(activeTab)
    setActiveTab(newTab)
    
    // Update tab start time
    setTabStartTime(prev => ({
      ...prev,
      [newTab]: currentTime,
    }))

    // Track tabs visited
    if (!tabsVisited.includes(newTab)) {
      setTabsVisited(prev => [...prev, newTab])
    }
  }

  // Track page leave
  useEffect(() => {
    return () => {
      if (hasTrackedPageLeave.current) return
      hasTrackedPageLeave.current = true

      const currentTime = Date.now()
      const timeSpentOnPage = Math.floor((currentTime - sessionStartTime) / 1000)
      
      const timeSpentOnProfile = tabStartTime.profile > 0
        ? Math.floor((currentTime - tabStartTime.profile) / 1000)
        : 0
      const timeSpentOnAccount = tabStartTime.account > 0
        ? Math.floor((currentTime - tabStartTime.account) / 1000)
        : 0
      const timeSpentOnLogout = tabStartTime.logout > 0
        ? Math.floor((currentTime - tabStartTime.logout) / 1000)
        : 0

      const tabSwitchesCount = tabsVisited.length - 1

      const userStateContext = getDashboardTrackingContext(
        stats,
        subscription,
        featureFlags,
        { createdAt: userCreatedAt }
      )

      trackEvent('User Left Settings Page', {
        'Time Spent on Page': timeSpentOnPage,
        'Tabs Visited': tabsVisited,
        'Time Spent on Profile Tab': timeSpentOnProfile,
        'Time Spent on Account Tab': timeSpentOnAccount,
        'Time Spent on Logout Tab': timeSpentOnLogout,
        'Tab Switches Count': tabSwitchesCount,
        'Profile Updated': profileUpdated,
        'Password Changed': passwordChanged,
        'Page Route': '/dashboard/settings',
        ...userStateContext,
      })
    }
  }, [stats, subscription, coach, compensation, impactPortfolio, careerTracker, userCreatedAt, sessionStartTime, tabStartTime, tabsVisited, profileUpdated, passwordChanged])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-gray-700 font-semibold">
            Manage your profile, account, and preferences
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sub-left Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-4 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              <TrackedButton
                onClick={() => handleTabChange('profile')}
                className={`w-full text-left px-4 py-3 rounded-[1rem] font-semibold transition-all duration-200 mb-2 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_4px_0_0_rgba(147,51,234,0.4)]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                eventName="User Switched Settings Tab"
                buttonId="settings-tab-profile-button"
                eventProperties={{
                  'Button Section': 'Settings Navigation',
                  'Button Position': 'First Tab Button',
                  'Button Text': 'Profile Information',
                  'Button Type': 'Tab Navigation',
                  'Button Context': 'Left sidebar navigation',
                  'From Tab': activeTab,
                  'To Tab': 'profile',
                }}
                tabIndex={0}
                aria-label="Profile Information"
              >
                Profile Information
              </TrackedButton>
              <TrackedButton
                onClick={() => handleTabChange('account')}
                className={`w-full text-left px-4 py-3 rounded-[1rem] font-semibold transition-all duration-200 mb-2 ${
                  activeTab === 'account'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_4px_0_0_rgba(147,51,234,0.4)]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                eventName="User Switched Settings Tab"
                buttonId="settings-tab-account-button"
                eventProperties={{
                  'Button Section': 'Settings Navigation',
                  'Button Position': 'Second Tab Button',
                  'Button Text': 'Account Information',
                  'Button Type': 'Tab Navigation',
                  'Button Context': 'Left sidebar navigation',
                  'From Tab': activeTab,
                  'To Tab': 'account',
                }}
                tabIndex={0}
                aria-label="Account Information"
              >
                Account Information
              </TrackedButton>
              <TrackedButton
                onClick={() => handleTabChange('logout')}
                className={`w-full text-left px-4 py-3 rounded-[1rem] font-semibold transition-all duration-200 ${
                  activeTab === 'logout'
                    ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-[0_4px_0_0_rgba(239,68,68,0.4)]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                eventName="User Switched Settings Tab"
                buttonId="settings-tab-logout-button"
                eventProperties={{
                  'Button Section': 'Settings Navigation',
                  'Button Position': 'Third Tab Button',
                  'Button Text': 'Log Out',
                  'Button Type': 'Tab Navigation',
                  'Button Context': 'Left sidebar navigation',
                  'From Tab': activeTab,
                  'To Tab': 'logout',
                }}
                tabIndex={0}
                aria-label="Log Out"
              >
                Log Out
              </TrackedButton>
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              {activeTab === 'profile' && (
                <ProfileInformation
                  stats={stats}
                  subscription={subscription}
                  userCreatedAt={userCreatedAt}
                  featureFlags={featureFlags}
                  onProfileUpdated={() => setProfileUpdated(true)}
                />
              )}
              {activeTab === 'account' && (
                <AccountInformation
                  stats={stats}
                  subscription={subscription}
                  userCreatedAt={userCreatedAt}
                  featureFlags={featureFlags}
                  onPasswordChanged={() => setPasswordChanged(true)}
                />
              )}
              {activeTab === 'logout' && (
                <LogOutSection
                  stats={stats}
                  subscription={subscription}
                  userCreatedAt={userCreatedAt}
                  featureFlags={featureFlags}
                  sessionStartTime={sessionStartTime}
                  tabsVisited={tabsVisited}
                  profileUpdated={profileUpdated}
                  passwordChanged={passwordChanged}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



