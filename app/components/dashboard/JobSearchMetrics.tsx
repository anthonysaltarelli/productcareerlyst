'use client'

import { MetricCard } from './MetricCard'
import { MetricSection, SectionIcons } from './MetricSection'
import { MiniBarChart } from './Sparkline'
import type { JobSearchMetrics as JobSearchMetricsType } from '@/lib/utils/dashboard-metrics'

interface JobSearchMetricsProps {
  metrics: JobSearchMetricsType | null
  loading?: boolean
}

const statusColors = {
  wishlist: '#94a3b8', // slate-400
  applied: '#60a5fa', // blue-400
  interviewing: '#a78bfa', // violet-400
  offer: '#34d399', // emerald-400
  accepted: '#22c55e', // green-500
  rejected: '#f87171', // red-400
  withdrawn: '#9ca3af', // gray-400
}

export const JobSearchMetrics = ({ metrics, loading = false }: JobSearchMetricsProps) => {
  if (loading || !metrics) {
    return (
      <MetricSection
        title="Job Search"
        icon={SectionIcons.jobs}
        linkHref="/dashboard/jobs"
        linkText="View applications"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

  // Prepare bar chart data
  const barChartData = [
    { label: 'Wishlist', value: metrics.applicationsByStatus.wishlist, color: statusColors.wishlist },
    { label: 'Applied', value: metrics.applicationsByStatus.applied, color: statusColors.applied },
    { label: 'Interviewing', value: metrics.applicationsByStatus.interviewing, color: statusColors.interviewing },
    { label: 'Offer', value: metrics.applicationsByStatus.offer, color: statusColors.offer },
    { label: 'Accepted', value: metrics.applicationsByStatus.accepted, color: statusColors.accepted },
  ].filter(d => d.value > 0)

  return (
    <MetricSection
      title="Job Search"
      icon={SectionIcons.jobs}
      linkHref="/dashboard/jobs"
      linkText="View applications"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Applications"
          value={metrics.totalApplications}
          previousValue={metrics.previousTotalApplications}
          sparklineData={metrics.dailyApplications}
          size="sm"
        />
        <MetricCard
          label="Active"
          value={metrics.activeApplications}
          size="sm"
        />
        <MetricCard
          label="Interview Rate"
          value={Math.round(metrics.interviewRate)}
          suffix="%"
          size="sm"
        />
        <MetricCard
          label="Offer Rate"
          value={Math.round(metrics.offerRate)}
          suffix="%"
          size="sm"
        />
        <MetricCard
          label="Contacts"
          value={metrics.contactsCount}
          previousValue={metrics.previousContactsCount}
          size="sm"
        />
        <MetricCard
          label="Companies Researched"
          value={metrics.companiesResearched}
          size="sm"
        />

        {/* Status breakdown - spans 2 columns */}
        {barChartData.length > 0 && (
          <div className="col-span-2 p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-700 mb-2">Status Breakdown</p>
            <MiniBarChart data={barChartData} height={12} />
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {Object.entries(metrics.applicationsByStatus)
                .filter(([_, count]) => count > 0)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
                    />
                    <span className="text-xs text-gray-600 capitalize">{status}</span>
                    <span className="text-xs font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </MetricSection>
  )
}
