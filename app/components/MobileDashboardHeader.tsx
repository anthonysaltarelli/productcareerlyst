'use client'

import Link from 'next/link'
import { Menu, ChevronLeft } from 'lucide-react'
import { TrackedLink } from '@/app/components/TrackedLink'

interface MobileDashboardHeaderProps {
  title: string
  showBackButton?: boolean
  backHref?: string
  backLabel?: string
}

export const MobileDashboardHeader = ({
  title,
  showBackButton = false,
  backHref,
  backLabel = 'Back',
}: MobileDashboardHeaderProps) => {
  return (
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
            <TrackedLink
              href="/dashboard"
              linkId="mobile-header-menu-link"
              eventName="User Clicked Mobile Header Menu"
              eventProperties={{
                'Link Section': 'Mobile Dashboard Header',
                'Link Position': 'Left side of header',
                'Link Text': 'Menu',
                'Link Type': 'Navigation Menu',
                'Current Page Title': title,
              }}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6 text-gray-300" />
            </TrackedLink>
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
  )
}

