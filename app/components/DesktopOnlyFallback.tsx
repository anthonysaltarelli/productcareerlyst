'use client'

import { Monitor, ArrowLeft } from 'lucide-react'
import { TrackedLink } from '@/app/components/TrackedLink'
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader'

interface DesktopOnlyFallbackProps {
  featureName: string
  description?: string
  pageTitle?: string
}

export const DesktopOnlyFallback = ({
  featureName,
  description = 'This feature requires a larger screen for the best experience.',
  pageTitle,
}: DesktopOnlyFallbackProps) => {
  return (
    <>
      {/* Mobile header */}
      <MobileDashboardHeader title={pageTitle || featureName} />
      
      {/* Fallback content - only visible on mobile */}
      <div className="md:hidden min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center p-6 pt-20">
        <div className="max-w-md w-full">
          <div className="p-8 rounded-[2.5rem] bg-white shadow-[0_15px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-200 text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-[1.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_8px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 flex items-center justify-center">
              <Monitor className="w-10 h-10 text-purple-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-gray-800 mb-3">
              Desktop Required
            </h1>

            {/* Feature name */}
            <p className="text-lg font-bold text-purple-600 mb-4">
              {featureName}
            </p>

            {/* Description */}
            <p className="text-gray-600 font-medium mb-6">
              {description}
            </p>

            {/* Additional info */}
            <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-200 mb-6">
              <p className="text-sm text-gray-700 font-semibold">
                💻 Please access this feature from a computer or laptop for the full experience.
              </p>
            </div>

            {/* Back to dashboard link */}
            <TrackedLink
              href="/dashboard"
              linkId="desktop-only-fallback-back-link"
              eventName="User Clicked Desktop Only Fallback Back"
              eventProperties={{
                'Link Section': 'Desktop Only Fallback',
                'Link Position': 'Bottom of fallback card',
                'Link Text': 'Back to Dashboard',
                'Link Type': 'Navigation CTA',
                'Feature Name': featureName,
                'Page Title': pageTitle || featureName,
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.4)] font-black text-white transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </TrackedLink>
          </div>
        </div>
      </div>
    </>
  )
}









