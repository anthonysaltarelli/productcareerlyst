'use client'

import { useState, useEffect, useRef } from 'react'
import { DashboardNavigation } from '@/app/components/DashboardNavigation'
import { Menu, X } from 'lucide-react'

interface DashboardHomeContentProps {
  desktopContent: React.ReactNode
  firstName?: string | null
}

export const DashboardHomeContent = ({ desktopContent, firstName }: DashboardHomeContentProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(64) // Default to 64px
  const headerRef = useRef<HTMLElement>(null)

  // Measure header height and prevent body scrolling on mobile
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight
        setHeaderHeight(height)
      }
    }

    // Measure on mount and resize
    updateHeaderHeight()
    window.addEventListener('resize', updateHeaderHeight)

    // Prevent body/html scrolling on mobile - only main element should scroll
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      // Prevent scrolling on html and body - main element will handle scrolling
      document.documentElement.style.overflow = 'hidden'
      document.documentElement.style.height = '100%'
      document.body.style.overflow = 'hidden'
      document.body.style.height = '100%'
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight)
      // Restore body scrolling when component unmounts
      document.documentElement.style.overflow = ''
      document.documentElement.style.height = ''
      document.body.style.overflow = ''
      document.body.style.height = ''
    }
  }, [])

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

      {/* Mobile Header with Menu Button - Hidden when navigation menu is open */}
      {!isMobileMenuOpen && (
        <header 
          ref={headerRef}
          className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 border-b-2 border-slate-700 px-4 py-3"
        >
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
      )}

      {/* Mobile Content - Show dashboard content on mobile with proper header offset */}
      {/* Dynamic padding-top matches the actual fixed header height */}
      {/* min-h ensures content is at least viewport height minus header, but can grow beyond */}
      {/* Bottom padding ensures last component is fully visible when scrolling */}
      <div 
        className="md:hidden pb-24"
        style={{ 
          paddingTop: `${headerHeight}px`,
          minHeight: `calc(100vh - ${headerHeight}px)`
        }}
      >
        {desktopContent}
      </div>

      {/* Desktop Content */}
      <div className="hidden md:block">
        {desktopContent}
      </div>
    </>
  )
}
