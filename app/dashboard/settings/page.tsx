'use client'

import { useState } from 'react'
import { ProfileInformation } from '@/app/components/settings/ProfileInformation'
import { AccountInformation } from '@/app/components/settings/AccountInformation'
import { LogOutSection } from '@/app/components/settings/LogOutSection'

type SettingsTab = 'profile' | 'account' | 'logout'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

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
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-3 rounded-[1rem] font-semibold transition-all duration-200 mb-2 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_4px_0_0_rgba(147,51,234,0.4)]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                tabIndex={0}
                aria-label="Profile Information"
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full text-left px-4 py-3 rounded-[1rem] font-semibold transition-all duration-200 mb-2 ${
                  activeTab === 'account'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_4px_0_0_rgba(147,51,234,0.4)]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                tabIndex={0}
                aria-label="Account Information"
              >
                Account Information
              </button>
              <button
                onClick={() => setActiveTab('logout')}
                className={`w-full text-left px-4 py-3 rounded-[1rem] font-semibold transition-all duration-200 ${
                  activeTab === 'logout'
                    ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-[0_4px_0_0_rgba(239,68,68,0.4)]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                tabIndex={0}
                aria-label="Log Out"
              >
                Log Out
              </button>
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200">
              {activeTab === 'profile' && <ProfileInformation />}
              {activeTab === 'account' && <AccountInformation />}
              {activeTab === 'logout' && <LogOutSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

