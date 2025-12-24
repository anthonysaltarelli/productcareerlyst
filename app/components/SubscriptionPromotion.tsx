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
    <div className="mt-6 mb-0 pb-12 md:pb-0">
      <div className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-purple-600 to-pink-500 border-2 border-purple-700 shadow-[0_12px_0_0_rgba(147,51,234,0.3)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-white/20">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                Upgrade to Accelerate
              </h2>
            </div>
            <p className="text-purple-100 font-medium mb-4">
              Unlock unlimited AI tools, premium resources, and career acceleration features.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {keyBenefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-white/90 text-sm font-medium"
                >
                  <span className="text-lg">{benefit.icon}</span>
                  <span>{benefit.title}</span>
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
                'Button Text': 'View Plans & Pricing',
                'Button Type': 'Primary CTA',
                'Button Context': 'After all dashboard content, subscription promotion section',
                'Subscription Plan': subscription.plan,
                'Subscription Status': subscription.status,
                'Is Subscription Active': subscription.isActive,
                'Promotion Theme': 'Purple to pink gradient',
                ...userStateContext,
              }}
              className="group block"
            >
              <div className="px-6 py-4 rounded-[1.5rem] bg-white text-purple-600 font-black text-base shadow-[0_6px_0_0_rgba(255,255,255,0.3)] hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(255,255,255,0.3)] transition-all text-center whitespace-nowrap">
                View Plans & Pricing
              </div>
            </TrackedButton>
            <p className="text-purple-200 text-xs text-center font-medium mt-2">
              Starting at $7/month • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

