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
      <div className="md:hidden min-h-screen bg-gray-50 flex items-center justify-center p-6 pt-20">
        <div className="max-w-md w-full">
          <div className="p-8 rounded-[2rem] bg-white shadow-sm border-2 border-gray-200 text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-purple-100 flex items-center justify-center">
              <Monitor className="w-8 h-8 text-purple-600" />
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
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 mb-6">
              <p className="text-sm text-gray-700 font-medium">
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white transition-colors"
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









