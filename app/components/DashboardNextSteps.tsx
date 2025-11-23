'use client'

import { useFlags } from 'launchdarkly-react-client-sdk'
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

interface DashboardNextStepsProps {
  milestones: Milestones
  stats: {
    lessonsCompleted: number
    coursesCompleted: number
    highestResumeScore: number | null
    totalJobApplications: number
  } | null
  fullStats?: DashboardStats | null
  subscription?: {
    plan: 'learn' | 'accelerate' | null
    status: string | null
    isActive: boolean
  } | null
}

const getNextSteps = (milestones: Milestones, stats: DashboardNextStepsProps['stats']) => {
  const steps: Array<{
    number: number
    title: string
    description: string
    href: string
    color: string
    priority: number
  }> = []

  if (!stats) {
    return []
  }

  // Priority 1: First lesson
  if (!milestones.firstLessonWatched) {
    steps.push({
      number: 1,
      title: 'Watch Your First Lesson',
      description: 'Start learning with your first video lesson',
      href: '/dashboard/courses',
      color: 'from-indigo-500 to-purple-500',
      priority: 1,
    })
  }

  // Priority 2: Import resume
  if (!milestones.firstResumeImported) {
    steps.push({
      number: steps.length + 1,
      title: 'Import Your Resume',
      description: 'Upload your resume to get started with analysis',
      href: '/dashboard/resume',
      color: 'from-blue-500 to-cyan-500',
      priority: 2,
    })
  }

  // Priority 3: First course
  if (!milestones.firstCourseCompleted && milestones.firstLessonWatched) {
    steps.push({
      number: steps.length + 1,
      title: 'Complete Your First Course',
      description: 'Finish all lessons in a course to unlock achievements',
      href: '/dashboard/courses',
      color: 'from-purple-500 to-pink-500',
      priority: 3,
    })
  }

  // Priority 4: Resume score
  if (milestones.firstResumeImported && stats.highestResumeScore === null) {
    steps.push({
      number: steps.length + 1,
      title: 'Analyze Your Resume',
      description: 'Get your resume scored and receive improvement suggestions',
      href: '/dashboard/resume',
      color: 'from-green-500 to-emerald-500',
      priority: 4,
    })
  } else if (milestones.firstResumeImported && stats.highestResumeScore !== null && stats.highestResumeScore < 70) {
    steps.push({
      number: steps.length + 1,
      title: 'Improve Your Resume Score',
      description: `Your current score is ${stats.highestResumeScore}. Aim for 70+!`,
      href: '/dashboard/resume',
      color: 'from-yellow-500 to-orange-500',
      priority: 4,
    })
  }

  // Priority 5: Add first job
  if (!milestones.firstJobAdded) {
    steps.push({
      number: steps.length + 1,
      title: 'Add Your First Job',
      description: 'Start tracking job applications and opportunities',
      href: '/dashboard/jobs',
      color: 'from-teal-500 to-cyan-500',
      priority: 5,
    })
  }

  // Priority 6: Access templates
  if (!milestones.firstTemplateAccessed) {
    steps.push({
      number: steps.length + 1,
      title: 'Explore PM Templates',
      description: 'Access templates, guides, and resources',
      href: '/dashboard/templates',
      color: 'from-violet-500 to-purple-500',
      priority: 6,
    })
  }

  // Sort by priority and take top 3
  return steps.sort((a, b) => a.priority - b.priority).slice(0, 3)
}

export const DashboardNextSteps = ({ milestones, stats, fullStats, subscription }: DashboardNextStepsProps) => {
  const { coach } = useFlags()
  const nextSteps = getNextSteps(milestones, stats)

  // Get user state context for tracking
  const userStateContext = fullStats && subscription
    ? getDashboardTrackingContext(fullStats, subscription)
    : {}

  // If no next steps, show generic encouragement
  if (nextSteps.length === 0) {
    return (
      <div className="mb-8 p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_20px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800">
        <h2 className="text-3xl font-black text-white mb-6 text-center">
          🎉 You're Doing Great!
        </h2>
        <p className="text-white/80 text-center font-semibold">
          Keep exploring features and building your PM career. Check out your progress above!
        </p>
      </div>
    )
  }

  return (
    <div className="mb-8 p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_20px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800">
      <h2 className="text-3xl font-black text-white mb-6 text-center">
        🎯 Your Next Steps
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {nextSteps.map((step, index) => (
          <TrackedLink
            key={index}
            href={step.href}
            eventName="User Clicked Next Step Card"
            linkId={`dashboard-next-step-${step.number}-link`}
            eventProperties={{
              'Step Number': step.number,
              'Step Title': step.title,
              'Step Description': step.description,
              'Step Href': step.href,
              'Step Color': step.color,
              'Step Priority': step.priority,
              'Step Position': `Step ${step.number}`,
              'Total Next Steps': nextSteps.length,
              ...userStateContext,
            }}
            className="group"
          >
            <div className="p-6 rounded-[1.5rem] bg-white/10 border-2 border-slate-600 hover:bg-white/15 transition-all duration-200">
              <div className={`w-12 h-12 rounded-[1rem] bg-gradient-to-br ${step.color} text-white font-black flex items-center justify-center mb-4`}>
                {step.number}
              </div>
              <p className="text-white font-bold mb-2">{step.title}</p>
              <p className="text-gray-400 text-sm font-medium">
                {step.description}
              </p>
            </div>
          </TrackedLink>
        ))}
      </div>
    </div>
  )
}

