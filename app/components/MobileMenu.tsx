'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { TrackedLink } from './TrackedLink'
import { TrackedButton } from './TrackedButton'
import { trackEvent } from '@/lib/amplitude/client'

interface MobileMenuProps {
  user: User | null
  isOnboardingComplete?: boolean
}

export const MobileMenu = ({ user, isOnboardingComplete = true }: MobileMenuProps) => {
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
        });
      } catch (error) {
        // Silently fail - analytics should never block UI
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Mobile menu tracking error (non-blocking):', error);
        }
      }
    }, 0);
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleToggleMenu()
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div
        className="md:hidden cursor-pointer px-4 py-2 rounded-[1rem] bg-white/50 border-2 border-purple-300"
        onClick={handleToggleMenu}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Toggle mobile menu"
        aria-expanded={isMobileMenuOpen}
      >
        <div className="space-y-1.5">
          <div className="w-6 h-0.5 bg-purple-600"></div>
          <div className="w-6 h-0.5 bg-purple-600"></div>
          <div className="w-6 h-0.5 bg-purple-600"></div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-4 right-4 p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
          <div className="flex flex-col gap-3">
            {user ? (
              <>
                <div className="px-6 py-3 rounded-[1.5rem] bg-white/70 border-2 border-purple-300 text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">Signed in as</p>
                  <p className="text-sm font-bold text-purple-700">{user.email}</p>
                </div>
                {isOnboardingComplete && (
                  <TrackedLink
                    href="/dashboard"
                    className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 bg-white/50 hover:bg-white transition-all duration-200 text-center"
                    eventName="User Clicked Dashboard Link"
                    linkId="mobile-menu-dashboard-link"
                    eventProperties={{
                      'Link Section': 'Mobile Menu',
                      'Link Position': 'Mobile menu (when logged in)',
                      'Link Type': 'Navigation Link',
                      'Link Text': 'Dashboard',
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </TrackedLink>
                )}
              </>
            ) : (
              <>
                <TrackedLink
                  href="/courses"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 bg-white/50 hover:bg-white transition-all duration-200 text-center"
                  eventName="User Clicked Courses Link"
                  linkId="mobile-menu-courses-link"
                  eventProperties={{
                    'Link Section': 'Mobile Menu',
                    'Link Position': 'Mobile menu',
                    'Link Type': 'Navigation Link',
                    'Link Text': 'Courses',
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Courses
                </TrackedLink>
                <TrackedLink
                  href="/resume"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 bg-white/50 hover:bg-white transition-all duration-200 text-center"
                  eventName="User Clicked Resume Link"
                  linkId="mobile-menu-resume-link"
                  eventProperties={{
                    'Link Section': 'Mobile Menu',
                    'Link Position': 'Mobile menu',
                    'Link Type': 'Navigation Link',
                    'Link Text': 'Resume',
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Resume
                </TrackedLink>
                <TrackedLink
                  href="/job-center"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 bg-white/50 hover:bg-white transition-all duration-200 text-center"
                  eventName="User Clicked Job Center Link"
                  linkId="mobile-menu-job-center-link"
                  eventProperties={{
                    'Link Section': 'Mobile Menu',
                    'Link Position': 'Mobile menu',
                    'Link Type': 'Navigation Link',
                    'Link Text': 'Job Center',
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Job Center
                </TrackedLink>
                <TrackedLink
                  href="/portfolio"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 bg-white/50 hover:bg-white transition-all duration-200 text-center"
                  eventName="User Clicked Portfolio Link"
                  linkId="mobile-menu-portfolio-link"
                  eventProperties={{
                    'Link Section': 'Mobile Menu',
                    'Link Position': 'Mobile menu',
                    'Link Type': 'Navigation Link',
                    'Link Text': 'Product Portfolio',
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Product Portfolio
                </TrackedLink>
                <TrackedLink
                  href="/pricing"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 bg-white/50 hover:bg-white transition-all duration-200 text-center"
                  eventName="User Clicked Pricing Link"
                  linkId="mobile-menu-pricing-link"
                  eventProperties={{
                    'Link Section': 'Mobile Menu',
                    'Link Position': 'Mobile menu',
                    'Link Type': 'Navigation Link',
                    'Link Text': 'Pricing',
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </TrackedLink>
                <TrackedLink
                  href="/auth/login"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 bg-white/50 hover:bg-white transition-all duration-200 text-center"
                  eventName="User Clicked Sign In Link"
                  linkId="mobile-menu-sign-in-link"
                  eventProperties={{
                    'Link Section': 'Mobile Menu',
                    'Link Position': 'Mobile menu',
                    'Link Type': 'Navigation Link',
                    'Link Text': 'Sign In',
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </TrackedLink>
                <TrackedButton
                  href="/auth/sign-up"
                  className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 text-center"
                  eventName="User Clicked Sign Up Button"
                  buttonId="mobile-menu-get-access-button"
                  eventProperties={{
                    'Button Section': 'Mobile Menu',
                    'Button Position': 'Bottom of mobile menu',
                    'Button Type': 'Primary CTA',
                    'Button Text': 'Get Access →',
                    'Button Context': 'Mobile menu, after Sign In link',
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Access →
                </TrackedButton>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

