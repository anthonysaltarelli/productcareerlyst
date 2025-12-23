'use client'

import { useState, useEffect, useCallback } from 'react'
import { TimeRangeSelector, type TimeRange } from './TimeRangeSelector'
import { LearningMetrics } from './LearningMetrics'
import { JobSearchMetrics } from './JobSearchMetrics'
import { InterviewMetrics } from './InterviewMetrics'
import { ResumeMetrics } from './ResumeMetrics'
import { PortfolioMetrics } from './PortfolioMetrics'
import type { DashboardMetrics } from '@/lib/utils/dashboard-metrics'

interface ExpandedDashboardMetricsProps {
  initialTimeRange?: TimeRange
}

export const ExpandedDashboardMetrics = ({
  initialTimeRange = '30d',
}: ExpandedDashboardMetricsProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async (range: TimeRange) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dashboard/metrics?range=${range}`)

      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }

      const data = await response.json()
      setMetrics(data.metrics)
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err)
      setError('Failed to load metrics. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics(timeRange)
  }, [timeRange, fetchMetrics])

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range)
    // Update URL params for shareability
    const url = new URL(window.location.href)
    url.searchParams.set('range', range)
    window.history.replaceState({}, '', url.toString())
  }

  // Get time range from URL on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const rangeParam = urlParams.get('range') as TimeRange | null
    if (rangeParam && ['7d', '30d', '90d', 'all'].includes(rangeParam)) {
      setTimeRange(rangeParam)
    }
  }, [])

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Career Metrics</h2>
          <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
        </div>
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => fetchMetrics(timeRange)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with time range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Career Metrics</h2>
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
      </div>

      {/* Metrics Sections */}
      <div className="space-y-8">
        <LearningMetrics metrics={metrics?.learning ?? null} loading={loading} />
        <JobSearchMetrics metrics={metrics?.jobSearch ?? null} loading={loading} />
        <InterviewMetrics metrics={metrics?.interview ?? null} loading={loading} />
        <ResumeMetrics metrics={metrics?.resume ?? null} loading={loading} />
        <PortfolioMetrics metrics={metrics?.portfolio ?? null} loading={loading} />
      </div>
    </div>
  )
}
