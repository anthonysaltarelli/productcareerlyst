'use client'

import { MetricCard } from './MetricCard'
import { MetricSection, SectionIcons } from './MetricSection'
import type { PortfolioMetrics as PortfolioMetricsType } from '@/lib/utils/dashboard-metrics'

interface PortfolioMetricsProps {
  metrics: PortfolioMetricsType | null
  loading?: boolean
}

export const PortfolioMetrics = ({ metrics, loading = false }: PortfolioMetricsProps) => {
  if (loading || !metrics) {
    return (
      <MetricSection
        title="Portfolio"
        icon={SectionIcons.portfolio}
        linkHref="/dashboard/portfolio"
        linkText="Edit portfolio"
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
      title="Portfolio"
      icon={SectionIcons.portfolio}
      linkHref="/dashboard/portfolio"
      linkText="Edit portfolio"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Status"
          value={metrics.isPublished ? 'Published' : 'Draft'}
          size="sm"
          textColor={metrics.isPublished ? 'text-green-600' : 'text-amber-600'}
        />
        <MetricCard
          label="Total Pages"
          value={metrics.totalPages}
          previousValue={metrics.previousTotalPages}
          size="sm"
        />
        <MetricCard
          label="Published"
          value={metrics.publishedPages}
          size="sm"
        />
        <MetricCard
          label="Drafts"
          value={metrics.draftPages}
          size="sm"
        />
      </div>
    </MetricSection>
  )
}
