'use client'

import { TrackedButton } from '@/app/components/TrackedButton'
import { getDashboardTrackingContext } from '@/lib/utils/dashboard-tracking-context'
import type { DashboardStats } from '@/app/api/dashboard/stats/route'

interface SubscriptionPromotionProps {
  subscription: {
    plan: 'learn' | 'accelerate' | null
    status: string | null
    isActive: boolean
  }
  stats?: DashboardStats | null
}

export const SubscriptionPromotion = ({ subscription, stats }: SubscriptionPromotionProps) => {
  // Only show if user doesn't have an active subscription
  if (subscription.isActive) {
    return null
  }

  // Get user state context for tracking
  const userStateContext = stats
    ? getDashboardTrackingContext(stats, subscription)
    : {}

  const keyBenefits = [
    {
      icon: '🤖',
      title: 'Unlimited AI Resume Optimization',
      description: 'Get unlimited AI-powered bullet point improvements and resume analysis',
    },
    {
      icon: '💼',
      title: 'Unlimited Job Tracking',
      description: 'Track unlimited applications, research companies, and manage your job search',
    },
    {
      icon: '📚',
      title: 'Full Course Library',
      description: 'Access all courses, lessons, and premium learning content',
    },
    {
      icon: '⚡',
      title: 'Premium Templates & Tools',
      description: 'Get access to PRDs, roadmaps, OKRs, and 20+ PM resources',
    },
  ]

  return (
    <div className="mt-8 mb-0 pb-12 md:pb-0">
      <div className="p-6 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 shadow-[0_20px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-400 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8">
            <div className="flex-1">
              <div className="inline-block px-6 py-3 rounded-[1.5rem] bg-white/20 backdrop-blur-sm text-white text-sm font-bold mb-4">
                🚀 Upgrade to Premium
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                Accelerate Your PM Career
              </h2>
              <p className="text-white/90 font-semibold text-lg mb-6">
                Unlock unlimited access to AI-powered tools, premium resources, and career acceleration features
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {keyBenefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-[1rem] bg-white/10 backdrop-blur-sm border border-white/20"
                  >
                    <span className="text-2xl flex-shrink-0">{benefit.icon}</span>
                    <div>
                      <h3 className="text-white font-bold text-sm mb-1">{benefit.title}</h3>
                      <p className="text-white/80 text-xs font-medium">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-shrink-0 w-full lg:w-auto">
              <TrackedButton
                href="/dashboard/billing/plans"
                eventName="User Clicked Subscription Promotion CTA"
                buttonId="dashboard-subscription-promotion-cta"
                eventProperties={{
                  'Button Section': 'Subscription Promotion',
                  'Button Position': 'Center of Promotion Card',
                  'Button Text': 'View Plans & Pricing →',
                  'Button Type': 'Primary CTA',
                  'Button Context': 'After all dashboard content, subscription promotion section',
                  'Subscription Plan': subscription.plan,
                  'Subscription Status': subscription.status,
                  'Is Subscription Active': subscription.isActive,
                  'Promotion Theme': 'Gradient purple to pink to orange',
                  ...userStateContext,
                }}
                className="group block"
              >
                <div className="px-8 py-4 rounded-[1.5rem] bg-white text-purple-600 font-black text-lg shadow-[0_8px_0_0_rgba(0,0,0,0.2)] hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(0,0,0,0.2)] transition-all duration-200 text-center whitespace-nowrap mb-3">
                  View Plans & Pricing →
                </div>
              </TrackedButton>
              <p className="text-white/80 text-xs text-center font-medium">
                Starting at $7/month • Cancel anytime
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-white/20 text-white/80 text-sm font-medium">
            <span className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span>Save up to 40% with yearly plans</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span>Unlimited AI features</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

