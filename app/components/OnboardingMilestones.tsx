'use client'

import React from 'react'
import { TrackedLink } from '@/app/components/TrackedLink'
import { getDashboardTrackingContext } from '@/lib/utils/dashboard-tracking-context'
import type { DashboardStats } from '@/app/api/dashboard/stats/route'

interface Milestones {
  firstLessonWatched: boolean
  firstCourseCompleted: boolean
  firstResumeImported: boolean
  resumeScore70: boolean
  resumeScore80: boolean
  resumeScore90: boolean
  firstTemplateAccessed: boolean
  firstJobAdded: boolean
  firstContactAdded: boolean
  firstResearchViewed: boolean
}

interface OnboardingMilestonesProps {
  milestones: Milestones
  stats?: DashboardStats | null
  subscription?: {
    plan: 'learn' | 'accelerate' | null
    status: string | null
    isActive: boolean
  } | null
}

const MILESTONE_CONFIG = [
  {
    key: 'firstLessonWatched' as const,
    label: 'Watch Your First Lesson',
    description: 'Start learning with your first video lesson',
    icon: '📺',
    href: '/dashboard/courses',
    color: 'from-indigo-200 to-purple-200',
    borderColor: 'border-indigo-300',
    shadowColor: 'rgba(99,102,241,0.3)',
  },
  {
    key: 'firstCourseCompleted' as const,
    label: 'Complete Your First Course',
    description: 'Finish all lessons in a course',
    icon: '🎓',
    href: '/dashboard/courses',
    color: 'from-purple-200 to-pink-200',
    borderColor: 'border-purple-300',
    shadowColor: 'rgba(147,51,234,0.3)',
  },
  {
    key: 'firstResumeImported' as const,
    label: 'Import Your Resume',
    description: 'Upload your resume to get started',
    icon: '📄',
    href: '/dashboard/resume',
    color: 'from-blue-200 to-cyan-200',
    borderColor: 'border-blue-300',
    shadowColor: 'rgba(37,99,235,0.3)',
  },
  {
    key: 'resumeScore70' as const,
    label: 'Reach 70+ Resume Score',
    description: 'Get your resume analyzed and improve',
    icon: '⭐',
    href: '/dashboard/resume',
    color: 'from-green-200 to-emerald-200',
    borderColor: 'border-green-300',
    shadowColor: 'rgba(22,163,74,0.3)',
  },
  {
    key: 'resumeScore80' as const,
    label: 'Reach 80+ Resume Score',
    description: 'Optimize your resume further',
    icon: '🌟',
    href: '/dashboard/resume',
    color: 'from-yellow-200 to-orange-200',
    borderColor: 'border-yellow-300',
    shadowColor: 'rgba(234,179,8,0.3)',
  },
  {
    key: 'resumeScore90' as const,
    label: 'Reach 90+ Resume Score',
    description: 'Achieve an excellent resume score',
    icon: '💎',
    href: '/dashboard/resume',
    color: 'from-pink-200 to-rose-200',
    borderColor: 'border-pink-300',
    shadowColor: 'rgba(236,72,153,0.3)',
  },
  {
    key: 'firstTemplateAccessed' as const,
    label: 'Access Your First Template',
    description: 'Explore PM templates and resources',
    icon: '⚡',
    href: '/dashboard/templates',
    color: 'from-violet-200 to-purple-200',
    borderColor: 'border-violet-300',
    shadowColor: 'rgba(139,92,246,0.3)',
  },
  {
    key: 'firstJobAdded' as const,
    label: 'Add Your First Job',
    description: 'Start tracking job applications',
    icon: '💼',
    href: '/dashboard/jobs',
    color: 'from-teal-200 to-cyan-200',
    borderColor: 'border-teal-300',
    shadowColor: 'rgba(20,184,166,0.3)',
  },
  {
    key: 'firstContactAdded' as const,
    label: 'Add Your First Contact',
    description: 'Build your networking connections',
    icon: '🤝',
    href: '/dashboard/jobs',
    color: 'from-emerald-200 to-green-200',
    borderColor: 'border-emerald-300',
    shadowColor: 'rgba(16,185,129,0.3)',
  },
  {
    key: 'firstResearchViewed' as const,
    label: 'View Company Research',
    description: 'Research companies you\'re interested in',
    icon: '🔍',
    href: '/dashboard/jobs',
    color: 'from-amber-200 to-yellow-200',
    borderColor: 'border-amber-300',
    shadowColor: 'rgba(245,158,11,0.3)',
  },
]

export const OnboardingMilestones = ({ milestones, stats, subscription }: OnboardingMilestonesProps) => {
  const completedCount = Object.values(milestones).filter(Boolean).length
  const totalCount = MILESTONE_CONFIG.length
  const allCompleted = completedCount === totalCount

  // Don't show if all milestones are completed
  if (allCompleted) {
    return null
  }

  const incompleteMilestones = MILESTONE_CONFIG.filter(
    config => !milestones[config.key]
  )

  // Get user state context for tracking
  const userStateContext = stats && subscription
    ? getDashboardTrackingContext(stats, subscription)
    : {}

  // Calculate onboarding completion percentage
  const onboardingCompletionPercentage = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-gray-800 mb-2">
          🎯 Get Started
        </h2>
        <p className="text-gray-600 font-semibold">
          Complete {totalCount - completedCount} more milestone{totalCount - completedCount !== 1 ? 's' : ''} to unlock your full potential
        </p>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {incompleteMilestones.slice(0, 6).map((milestone, index) => {
          const shadowStyle: React.CSSProperties = { 
            boxShadow: `0 8px 0 0 ${milestone.shadowColor}` 
          }
          const hoverShadowStyle: React.CSSProperties = { 
            boxShadow: `0 4px 0 0 ${milestone.shadowColor}` 
          }
          
          // Calculate position in grid
          const row = Math.floor(index / 3) + 1
          const col = (index % 3) + 1
          const position = `Row ${row}, Column ${col}`
          
          return (
            <TrackedLink
              key={milestone.key}
              href={milestone.href}
              eventName="User Clicked Onboarding Milestone"
              linkId={`dashboard-milestone-${milestone.key}-link`}
              eventProperties={{
                'Milestone Key': milestone.key,
                'Milestone Label': milestone.label,
                'Milestone Description': milestone.description,
                'Milestone Icon': milestone.icon,
                'Milestone Href': milestone.href,
                'Milestone Color': milestone.color,
                'Milestone Position': position,
                'Onboarding Completion Percentage': onboardingCompletionPercentage,
                'Milestones Completed Count': completedCount,
                'Total Milestones': totalCount,
                ...userStateContext,
              }}
              className="group"
            >
              <div 
                className={`p-6 rounded-[1.5rem] bg-gradient-to-br ${milestone.color} border-2 ${milestone.borderColor} hover:translate-y-1 transition-all duration-200`}
                style={shadowStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = hoverShadowStyle.boxShadow || ''
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = shadowStyle.boxShadow || ''
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">{milestone.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {milestone.label}
                    </h3>
                    <p className="text-sm text-gray-700 font-medium">
                      {milestone.description}
                    </p>
                  </div>
                  <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                    →
                  </div>
                </div>
              </div>
            </TrackedLink>
          )
        })}
      </div>
    </div>
  )
}

