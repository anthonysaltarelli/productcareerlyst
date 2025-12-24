'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Rocket } from 'lucide-react'
import type { OnboardingProgress } from '@/lib/utils/onboarding-progress'

interface DashboardWelcomeProps {
  firstName: string | null
  subscription: {
    plan: 'learn' | 'accelerate' | null
    status: string | null
    isActive: boolean
  }
  onboardingProgress?: OnboardingProgress
}

export const DashboardWelcome = ({ firstName, subscription, onboardingProgress }: DashboardWelcomeProps) => {
  const router = useRouter()
  const [isRestoring, setIsRestoring] = useState(false)

  const planName = subscription.plan === 'learn'
    ? 'Learn'
    : subscription.plan === 'accelerate'
      ? 'Accelerate'
      : null

  const handleRestoreOnboarding = async () => {
    setIsRestoring(true)
    try {
      await fetch('/api/onboarding/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minimized: false }),
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to restore onboarding:', error)
    } finally {
      setIsRestoring(false)
    }
  }

  // Show Continue button if: minimized AND has incomplete items
  const showContinueButton = onboardingProgress?.isMinimized &&
    onboardingProgress.completedCount < onboardingProgress.totalCount

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
            Welcome back{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="text-gray-600 font-medium">
            {subscription.isActive && planName
              ? `You're on the ${planName} plan. Let's crush it today.`
              : 'Accelerate your product management career today.'
            }
          </p>
        </div>

        {/* Continue Onboarding Button */}
        {showContinueButton && (
          <button
            onClick={handleRestoreOnboarding}
            disabled={isRestoring}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            <span>Continue ({onboardingProgress.completedCount}/{onboardingProgress.totalCount})</span>
          </button>
        )}
      </div>
    </div>
  )
}
