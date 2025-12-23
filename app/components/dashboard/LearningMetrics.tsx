'use client'

import { MetricCard } from './MetricCard'
import { MetricSection, SectionIcons } from './MetricSection'
import type { LearningMetrics as LearningMetricsType } from '@/lib/utils/dashboard-metrics'

interface LearningMetricsProps {
  metrics: LearningMetricsType | null
  loading?: boolean
}

export const LearningMetrics = ({ metrics, loading = false }: LearningMetricsProps) => {
  if (loading || !metrics) {
    return (
      <MetricSection
        title="Learning Progress"
        icon={SectionIcons.learning}
        linkHref="/dashboard/courses"
        linkText="Continue learning"
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
      title="Learning Progress"
      icon={SectionIcons.learning}
      linkHref="/dashboard/courses"
      linkText="Continue learning"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Lessons Completed"
          value={metrics.lessonsCompleted}
          previousValue={metrics.previousLessonsCompleted}
          sparklineData={metrics.dailyLessons}
          size="sm"
        />
        <MetricCard
          label="Courses Completed"
          value={metrics.coursesCompleted}
          previousValue={metrics.previousCoursesCompleted}
          size="sm"
        />
        <MetricCard
          label="Learning Streak"
          value={metrics.learningStreak}
          suffix=" days"
          size="sm"
        />
        <MetricCard
          label="Completion Rate"
          value={Math.round(metrics.courseCompletionRate)}
          suffix="%"
          size="sm"
        />
      </div>
    </MetricSection>
  )
}
