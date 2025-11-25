'use client'

import { DashboardNavigation } from '@/app/components/DashboardNavigation'

interface DashboardHomeContentProps {
  desktopContent: React.ReactNode
  firstName?: string | null
}

export const DashboardHomeContent = ({ desktopContent, firstName }: DashboardHomeContentProps) => {
  return (
    <>
      {/* Mobile Navigation - Full screen menu */}
      <div className="md:hidden fixed inset-0 overflow-y-auto bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col z-50">
        {/* Mobile Header */}
        <div className="p-6 border-b-2 border-slate-700 flex-shrink-0">
          <h1 className="text-2xl font-black bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Product Careerlyst
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            {firstName ? `Welcome back, ${firstName}!` : 'Level up your PM career'}
          </p>
        </div>
        
        {/* Full screen navigation */}
        <DashboardNavigation fullScreen />
      </div>

      {/* Desktop Content - Hidden on mobile */}
      <div className="hidden md:block">
        {desktopContent}
      </div>
    </>
  )
}
