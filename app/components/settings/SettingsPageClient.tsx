'use client'

import { useState, useEffect, useRef } from 'react'
import { ProfileInformation } from '@/app/components/settings/ProfileInformation'
import { AccountInformation } from '@/app/components/settings/AccountInformation'
import { LogOutSection } from '@/app/components/settings/LogOutSection'
import { ContactUsSection } from '@/app/components/settings/ContactUsSection'
import { TrackedButton } from '@/app/components/TrackedButton'
import { trackEvent } from '@/lib/amplitude/client'
import { getDashboardTrackingContext } from '@/lib/utils/dashboard-tracking-context'
import type { DashboardStats } from '@/app/api/dashboard/stats/route'
import { useFlags } from 'launchdarkly-react-client-sdk'

type SettingsTab = 'profile' | 'account' | 'contact' | 'logout'

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
    contact: 0,
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
      const timeSpentOnContact = tabStartTime.contact > 0
        ? Math.floor((currentTime - tabStartTime.contact) / 1000)
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
        'Time Spent on Contact Tab': timeSpentOnContact,
        'Time Spent on Logout Tab': timeSpentOnLogout,
        'Tab Switches Count': tabSwitchesCount,
        'Profile Updated': profileUpdated,
        'Password Changed': passwordChanged,
        'Page Route': '/dashboard/settings',
        ...userStateContext,
      })
    }
  }, [stats, subscription, coach, compensation, impactPortfolio, careerTracker, userCreatedAt, sessionStartTime, tabStartTime, tabsVisited, profileUpdated, passwordChanged])

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile Information', buttonId: 'settings-tab-profile-button' },
    { id: 'account' as SettingsTab, label: 'Account Information', buttonId: 'settings-tab-account-button' },
    { id: 'contact' as SettingsTab, label: 'Contact Us', buttonId: 'settings-tab-contact-button' },
    { id: 'logout' as SettingsTab, label: 'Log Out', buttonId: 'settings-tab-logout-button' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-4 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-gray-700 font-semibold text-sm md:text-base">
            Manage your profile, account, and preferences
          </p>
        </div>

        {/* Mobile: Horizontal Scrollable Carousel */}
        <div className="mb-6 md:hidden">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-3 min-w-max">
              {tabs.map((tab, index) => (
                <TrackedButton
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-shrink-0 px-6 py-3 rounded-[1rem] font-semibold transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? tab.id === 'logout'
                        ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-[0_4px_0_0_rgba(239,68,68,0.4)]'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_4px_0_0_rgba(147,51,234,0.4)]'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 border-2 border-gray-200'
                  }`}
                  eventName="User Switched Settings Tab"
                  buttonId={tab.buttonId}
                  eventProperties={{
                    'Button Section': 'Settings Navigation',
                    'Button Position': index === 0 ? 'First Tab Button' : index === 1 ? 'Second Tab Button' : index === 2 ? 'Third Tab Button' : 'Fourth Tab Button',
                    'Button Text': tab.label,
                    'Button Type': 'Tab Navigation',
                    'Button Context': 'Horizontal carousel navigation',
                    'From Tab': activeTab,
                    'To Tab': tab.id,
                  }}
                  tabIndex={0}
                  aria-label={tab.label}
                >
                  {tab.label}
                </TrackedButton>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop: Sub-left Navigation */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <nav className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-4 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              {tabs.map((tab, index) => (
                <TrackedButton
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-[1rem] font-semibold transition-all duration-200 ${
                    index < tabs.length - 1 ? 'mb-2' : ''
                  } ${
                    activeTab === tab.id
                      ? tab.id === 'logout'
                        ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-[0_4px_0_0_rgba(239,68,68,0.4)]'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_4px_0_0_rgba(147,51,234,0.4)]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  eventName="User Switched Settings Tab"
                  buttonId={tab.buttonId}
                  eventProperties={{
                    'Button Section': 'Settings Navigation',
                    'Button Position': index === 0 ? 'First Tab Button' : index === 1 ? 'Second Tab Button' : index === 2 ? 'Third Tab Button' : 'Fourth Tab Button',
                    'Button Text': tab.label,
                    'Button Type': 'Tab Navigation',
                    'Button Context': 'Left sidebar navigation',
                    'From Tab': activeTab,
                    'To Tab': tab.id,
                  }}
                  tabIndex={0}
                  aria-label={tab.label}
                >
                  {tab.label}
                </TrackedButton>
              ))}
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1 w-full">
            <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-4 md:p-8 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
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
              {activeTab === 'contact' && (
                <ContactUsSection />
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



