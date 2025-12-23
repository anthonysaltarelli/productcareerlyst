'use client'

import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader'

interface DashboardHomeContentProps {
  desktopContent: React.ReactNode
  firstName?: string | null
}

export const DashboardHomeContent = ({ desktopContent, firstName }: DashboardHomeContentProps) => {
  return (
    <>
      {/* Mobile Header - consistent with other dashboard pages */}
      <MobileDashboardHeader title="Dashboard" firstName={firstName} />

      {/* Mobile Content - Show dashboard content on mobile with proper header offset */}
      <div className="md:hidden min-h-screen bg-gray-50 pt-16 pb-24">
        {desktopContent}
      </div>

      {/* Desktop Content */}
      <div className="hidden md:block min-h-screen bg-gray-50">
        {desktopContent}
      </div>
    </>
  )
}
