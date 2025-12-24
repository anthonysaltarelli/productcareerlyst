'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  X,
  BookOpen,
  FileText,
  Sparkles,
  Briefcase,
  FolderOpen,
  FileCheck,
  Building2,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Rocket,
  ArrowRight
} from 'lucide-react'
import type { OnboardingProgress } from '@/lib/utils/onboarding-progress'

interface OnboardingChecklistProps {
  progress: OnboardingProgress
}

interface OnboardingItemConfig {
  id: keyof Omit<OnboardingProgress, 'isMinimized' | 'completedCount' | 'totalCount'>
  title: string
  description: string
  icon: React.ReactNode
  href: string
  cta: string
}

const ONBOARDING_ITEMS: OnboardingItemConfig[] = [
  {
    id: 'course_lesson',
    title: 'Complete your first course lesson',
    description: 'Start learning with our PM courses',
    icon: <BookOpen className="w-5 h-5" />,
    href: '/dashboard/courses',
    cta: 'Watch',
  },
  {
    id: 'upload_resume',
    title: 'Upload and import your Resume',
    description: 'Get your resume analyzed by AI',
    icon: <FileText className="w-5 h-5" />,
    href: '/dashboard/resume',
    cta: 'Upload',
  },
  {
    id: 'resume_score_90',
    title: 'Reach a 90+ Resume Score',
    description: 'Optimize your resume for maximum impact',
    icon: <Sparkles className="w-5 h-5" />,
    href: '/dashboard/resume',
    cta: 'Optimize',
  },
  {
    id: 'publish_portfolio',
    title: 'Create and Publish your Product Portfolio',
    description: 'Showcase your PM work to employers',
    icon: <FolderOpen className="w-5 h-5" />,
    href: '/dashboard/portfolio',
    cta: 'Create',
  },
  {
    id: 'add_job',
    title: 'Add your First Job',
    description: 'Track jobs you\'re interested in',
    icon: <Briefcase className="w-5 h-5" />,
    href: '/dashboard/jobs',
    cta: 'Add Job',
  },
  {
    id: 'custom_resume',
    title: 'Create a Job Specific Resume',
    description: 'Tailor your resume for a specific role',
    icon: <FileCheck className="w-5 h-5" />,
    href: '/dashboard/jobs',
    cta: 'Customize',
  },
  {
    id: 'company_research',
    title: 'Access AI Company Research',
    description: 'Get AI-powered insights on target companies',
    icon: <Building2 className="w-5 h-5" />,
    href: '/dashboard/jobs',
    cta: 'Research',
  },
  {
    id: 'contact_email',
    title: 'Discover your first Verified PM Contact',
    description: 'Find verified contacts at target companies',
    icon: <Mail className="w-5 h-5" />,
    href: '/dashboard/jobs',
    cta: 'Discover',
  },
  {
    id: 'mock_interview',
    title: 'Finish your first AI Mock Interview',
    description: 'Practice with our AI interview coach',
    icon: <MessageSquare className="w-5 h-5" />,
    href: '/dashboard/interview',
    cta: 'Practice',
  },
]

export const OnboardingChecklist = ({ progress }: OnboardingChecklistProps) => {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMinimizing, setIsMinimizing] = useState(false)

  const { completedCount, totalCount, isMinimized } = progress
  const progressPercentage = Math.round((completedCount / totalCount) * 100)

  const handleMinimize = async () => {
    setIsMinimizing(true)
    try {
      await fetch('/api/onboarding/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minimized: true }),
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to minimize onboarding:', error)
    } finally {
      setIsMinimizing(false)
    }
  }

  // Don't render if minimized or all complete
  if (isMinimized || completedCount === totalCount) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Get Started with Product Careerlyst</h2>
                <p className="text-sm text-gray-600">Complete these steps to unlock your full potential</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Progress badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
                <span className="text-sm font-bold text-gray-700">{completedCount}/{totalCount}</span>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              {/* Collapse/Expand button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {/* Minimize button */}
              <button
                onClick={handleMinimize}
                disabled={isMinimizing}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50"
                title="Minimize onboarding"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Checklist Items */}
        {isExpanded && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ONBOARDING_ITEMS.map((item, index) => {
                const isCompleted = progress[item.id]
                return (
                  <div
                    key={item.id}
                    className={`group relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      isCompleted
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-gray-200 bg-gray-50/30 hover:border-purple-200 hover:bg-purple-50/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox (visual only - no toggle) */}
                      <div className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-300 group-hover:text-purple-400 transition-colors" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${isCompleted ? 'text-green-600' : 'text-purple-600'}`}>
                            {item.icon}
                          </span>
                          <span className={`text-xs font-medium ${isCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                            {isCompleted ? 'Complete' : `Step ${index + 1}`}
                          </span>
                        </div>
                        <p
                          className={`font-semibold text-sm leading-tight ${
                            isCompleted ? 'text-green-700' : 'text-gray-800'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className={`mt-1 text-xs ${isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                          {item.description}
                        </p>
                        {/* CTA Button */}
                        {!isCompleted && (
                          <Link
                            href={item.href}
                            className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                          >
                            {item.cta}
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
