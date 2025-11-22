'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface MobileMenuProps {
  user: User | null
}

export const MobileMenu = ({ user }: MobileMenuProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleToggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
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
                <a
                  href="/dashboard"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 bg-white/50 hover:bg-white transition-all duration-200 text-center"
                  tabIndex={0}
                  aria-label="Dashboard"
                >
                  Dashboard
                </a>
              </>
            ) : (
              <>
                <a
                  href="#features"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 bg-white/50 hover:bg-white transition-all duration-200 text-center"
                  tabIndex={0}
                  aria-label="Features"
                >
                  Features
                </a>
                <a
                  href="#testimonials"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 bg-white/50 hover:bg-white transition-all duration-200 text-center"
                  tabIndex={0}
                  aria-label="Testimonials"
                >
                  Testimonials
                </a>
                <a
                  href="/auth/login"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 bg-white/50 hover:bg-white transition-all duration-200 text-center"
                  tabIndex={0}
                  aria-label="Sign In"
                >
                  Sign In
                </a>
                <a
                  href="/auth/sign-up"
                  className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 text-center"
                  aria-label="Get access"
                >
                  Get Access →
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

