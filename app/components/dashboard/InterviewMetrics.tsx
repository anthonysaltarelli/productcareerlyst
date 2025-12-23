'use client'

import { MetricCard } from './MetricCard'
import { MetricSection, SectionIcons } from './MetricSection'
import type { InterviewMetrics as InterviewMetricsType } from '@/lib/utils/dashboard-metrics'

interface InterviewMetricsProps {
  metrics: InterviewMetricsType | null
  loading?: boolean
}

// Format score to display (4 = Strong Hire, 1 = Strong No Hire)
function formatScore(score: number | null): string {
  if (score === null) return '—'
  return score.toFixed(1)
}

function getScoreLabel(score: number | null): string {
  if (score === null) return 'No data'
  if (score >= 3.5) return 'Strong Hire'
  if (score >= 2.5) return 'Hire'
  if (score >= 1.5) return 'No Hire'
  return 'Needs Work'
}

// Format hours
function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`
  }
  return `${hours.toFixed(1)}h`
}

export const InterviewMetrics = ({ metrics, loading = false }: InterviewMetricsProps) => {
  if (loading || !metrics) {
    return (
      <MetricSection
        title="Interview Preparation"
        icon={SectionIcons.interview}
        linkHref="/dashboard/interview"
        linkText="Practice now"
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
      title="Interview Preparation"
      icon={SectionIcons.interview}
      linkHref="/dashboard/interview"
      linkText="Practice now"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Mock Interviews"
          value={metrics.mockInterviewsCompleted}
          previousValue={metrics.previousMockInterviews}
          size="sm"
        />
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-gray-900">
              {formatScore(metrics.averageScore)}
            </p>
            {metrics.previousAverageScore !== null && metrics.averageScore !== null && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                metrics.averageScore > metrics.previousAverageScore
                  ? 'bg-green-100 text-green-600'
                  : metrics.averageScore < metrics.previousAverageScore
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {metrics.averageScore > metrics.previousAverageScore ? '↑' :
                 metrics.averageScore < metrics.previousAverageScore ? '↓' : '—'}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-gray-700 mt-1">
            Avg Score ({getScoreLabel(metrics.averageScore)})
          </p>
        </div>
        <MetricCard
          label="Practice Hours"
          value={formatHours(metrics.practiceHours)}
          size="sm"
        />
        <MetricCard
          label="Types Practiced"
          value={metrics.typesPracticed}
          size="sm"
        />
      </div>
    </MetricSection>
  )
}
