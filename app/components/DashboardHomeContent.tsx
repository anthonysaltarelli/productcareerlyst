'use client'

import { useState } from 'react'
import { DashboardNavigation } from '@/app/components/DashboardNavigation'
import { Menu, X } from 'lucide-react'

interface DashboardHomeContentProps {
  desktopContent: React.ReactNode
  firstName?: string | null
}

export const DashboardHomeContent = ({ desktopContent, firstName }: DashboardHomeContentProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile Navigation - Full screen menu (toggleable) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 overflow-y-auto bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col z-50">
          {/* Mobile Header */}
          <div className="p-6 border-b-2 border-slate-700 flex-shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Product Careerlyst
              </h1>
              <p className="text-sm text-gray-400 font-medium mt-1">
                {firstName ? `Welcome back, ${firstName}!` : 'Level up your PM career'}
              </p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6 text-gray-300" />
            </button>
          </div>
          
          {/* Full screen navigation */}
          <DashboardNavigation fullScreen onNavClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Mobile Header with Menu Button */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-slate-800 to-slate-900 border-b-2 border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6 text-gray-300" />
          </button>
          <h1 className="text-lg font-bold text-white truncate max-w-[60%]">
            Dashboard Home
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Content - Show dashboard content on mobile with header offset */}
      <div className="md:hidden pt-16">
        {desktopContent}
      </div>

      {/* Desktop Content */}
      <div className="hidden md:block">
        {desktopContent}
      </div>
    </>
  )
}
