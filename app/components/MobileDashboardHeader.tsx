'use client'

import { useState } from 'react'
import { Menu, ChevronLeft, X } from 'lucide-react'
import { TrackedLink } from '@/app/components/TrackedLink'
import { DashboardNavigation } from '@/app/components/DashboardNavigation'
import { trackEvent } from '@/lib/amplitude/client'

interface MobileDashboardHeaderProps {
  title: string
  showBackButton?: boolean
  backHref?: string
  backLabel?: string
  firstName?: string | null
}

export const MobileDashboardHeader = ({
  title,
  showBackButton = false,
  backHref,
  backLabel = 'Back',
  firstName,
}: MobileDashboardHeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleToggleMenu = () => {
    const newState = !isMobileMenuOpen
    setIsMobileMenuOpen(newState)
    
    // Track menu toggle in background - don't block UI
    setTimeout(() => {
      try {
        const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
        trackEvent(newState ? 'User Opened Mobile Menu' : 'User Closed Mobile Menu', {
          'Page Route': pageRoute,
          'Page Title': title,
        });
      } catch (error) {
        // Silently fail - analytics should never block UI
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Mobile menu tracking error (non-blocking):', error);
        }
      }
    }, 0);
  }

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
              onClick={handleToggleMenu}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6 text-gray-300" />
            </button>
          </div>
          
          {/* Full screen navigation */}
          <DashboardNavigation fullScreen onNavClick={handleToggleMenu} />
        </div>
      )}

      {/* Mobile Header with Menu Button - Hidden when navigation menu is open */}
      {!isMobileMenuOpen && (
        <header className="fixed top-0 left-0 right-0 z-50 md:hidden bg-gradient-to-r from-slate-800 to-slate-900 border-b-2 border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Menu or Back button */}
            <div className="flex items-center gap-3">
              {showBackButton && backHref ? (
                <TrackedLink
                  href={backHref}
                  linkId="mobile-header-back-link"
                  eventName="User Clicked Mobile Header Back"
                  eventProperties={{
                    'Link Section': 'Mobile Dashboard Header',
                    'Link Position': 'Left side of header',
                    'Link Text': backLabel,
                    'Link Type': 'Back Navigation',
                    'Current Page Title': title,
                    'Back Destination': backHref,
                  }}
                  className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
                  aria-label={backLabel}
                >
                  <ChevronLeft className="w-6 h-6" />
                  <span className="text-sm font-semibold">{backLabel}</span>
                </TrackedLink>
              ) : (
                <button
                  onClick={handleToggleMenu}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-6 h-6 text-gray-300" />
                </button>
              )}
            </div>

            {/* Center - Page title */}
            <h1 className="text-lg font-bold text-white truncate max-w-[60%]">
              {title}
            </h1>

            {/* Right side - Spacer for balance */}
            <div className="w-10" />
          </div>
        </header>
      )}
    </>
  )
}

