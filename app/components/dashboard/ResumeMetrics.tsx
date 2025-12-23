'use client'

import { MetricCard } from './MetricCard'
import { MetricSection, SectionIcons } from './MetricSection'
import type { ResumeMetrics as ResumeMetricsType } from '@/lib/utils/dashboard-metrics'

interface ResumeMetricsProps {
  metrics: ResumeMetricsType | null
  loading?: boolean
}

export const ResumeMetrics = ({ metrics, loading = false }: ResumeMetricsProps) => {
  if (loading || !metrics) {
    return (
      <MetricSection
        title="Resume"
        icon={SectionIcons.resume}
        linkHref="/dashboard/resume"
        linkText="Edit resume"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <MetricCard
              key={i}
              label=""
              value={0}
              loading={true}
              size="sm"
            />
          ))}
        </div>
      </MetricSection>
    )
  }

  return (
    <MetricSection
      title="Resume"
      icon={SectionIcons.resume}
      linkHref="/dashboard/resume"
      linkText="Edit resume"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Resume Versions"
          value={metrics.versionsCount}
          previousValue={metrics.previousVersionsCount}
          size="sm"
        />

        {/* Score card */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-gray-900">
              {metrics.highestScore !== null ? metrics.highestScore : '—'}
            </p>
            {metrics.scoreImprovement !== null && metrics.scoreImprovement !== 0 && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                metrics.scoreImprovement > 0
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}>
                {metrics.scoreImprovement > 0 ? '+' : ''}{metrics.scoreImprovement}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-gray-700 mt-1">
            Resume Score
            {metrics.highestScore !== null && (
              <span className="text-gray-500 ml-1">
                ({metrics.highestScore >= 90 ? 'Excellent' :
                  metrics.highestScore >= 80 ? 'Great' :
                  metrics.highestScore >= 70 ? 'Good' : 'Needs Work'})
              </span>
            )}
          </p>
        </div>

        <MetricCard
          label="Job-Specific"
          value={metrics.jobSpecificResumes}
          size="sm"
        />

        {/* Improvement indicator */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-black ${
              metrics.scoreImprovement !== null && metrics.scoreImprovement > 0
                ? 'text-green-600'
                : metrics.scoreImprovement !== null && metrics.scoreImprovement < 0
                ? 'text-red-600'
                : 'text-gray-900'
            }`}>
              {metrics.scoreImprovement !== null
                ? `${metrics.scoreImprovement > 0 ? '+' : ''}${metrics.scoreImprovement}`
                : '—'}
            </p>
          </div>
          <p className="text-xs font-semibold text-gray-700 mt-1">
            Score Improvement
          </p>
        </div>
      </div>
    </MetricSection>
  )
}
