'use client'

import { BarChart3, Mail } from 'lucide-react'
import { NavLink } from '@/app/components/NavLink'

interface AdminNavigationProps {
  fullScreen?: boolean
  onNavClick?: () => void
}

export const AdminNavigation = ({ fullScreen = false, onNavClick }: AdminNavigationProps) => {
  // Base styles for nav links
  const baseNavLinkClass = fullScreen
    ? 'flex items-center gap-4 px-4 py-4 rounded-[1.5rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-bold text-lg group'
    : 'flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group'

  const iconClass = fullScreen ? 'w-6 h-6 flex-shrink-0' : 'w-5 h-5 flex-shrink-0'

  return (
    <nav className={fullScreen ? 'px-4 py-6 pb-20 space-y-3 flex-1' : 'flex-1 p-4 space-y-2 overflow-y-auto'}>
      <NavLink
        href="/admin"
        eventName="Admin Clicked Navigation Link"
        linkId={fullScreen ? 'mobile-admin-nav-stats-link' : 'admin-nav-stats-link'}
        eventProperties={{
          'Link Text': 'Stats',
          'Link Destination': '/admin',
          'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
        }}
        className={baseNavLinkClass}
        onClick={onNavClick}
      >
        <BarChart3 className={iconClass} />
        <span>Stats</span>
      </NavLink>
      <NavLink
        href="/admin/nps"
        eventName="Admin Clicked Navigation Link"
        linkId={fullScreen ? 'mobile-admin-nav-nps-link' : 'admin-nav-nps-link'}
        eventProperties={{
          'Link Text': 'NPS',
          'Link Destination': '/admin/nps',
          'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
        }}
        className={baseNavLinkClass}
        onClick={onNavClick}
      >
        <Mail className={iconClass} />
        <span>NPS</span>
      </NavLink>
    </nav>
  )
}

