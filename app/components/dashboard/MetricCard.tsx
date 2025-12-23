'use client'

import { Sparkline } from './Sparkline'

interface MetricCardProps {
  label: string
  value: number | string
  previousValue?: number | null
  suffix?: string
  prefix?: string
  sparklineData?: number[]
  gradient?: string
  shadowColor?: string
  borderColor?: string
  textColor?: string
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const MetricCard = ({
  label,
  value,
  previousValue,
  suffix = '',
  prefix = '',
  sparklineData,
  gradient = 'from-indigo-100 to-purple-100',
  shadowColor = 'rgba(99,102,241,0.2)',
  borderColor = 'border-indigo-200',
  textColor = 'text-gray-900',
  size = 'md',
  loading = false,
}: MetricCardProps) => {
  // Calculate trend
  const currentNum = typeof value === 'number' ? value : 0
  const trend = previousValue !== null && previousValue !== undefined
    ? calculateTrend(currentNum, previousValue)
    : null

  const sizeClasses = {
    sm: {
      padding: 'p-4',
      valueSize: 'text-2xl',
      labelSize: 'text-xs',
      rounded: 'rounded-xl',
      shadow: 'shadow-sm',
    },
    md: {
      padding: 'p-5',
      valueSize: 'text-3xl',
      labelSize: 'text-sm',
      rounded: 'rounded-xl',
      shadow: 'shadow-sm',
    },
    lg: {
      padding: 'p-6',
      valueSize: 'text-4xl',
      labelSize: 'text-sm',
      rounded: 'rounded-xl',
      shadow: 'shadow-sm',
    },
  }

  const s = sizeClasses[size]

  if (loading) {
    return (
      <div
        className={`${s.padding} ${s.rounded} bg-white border border-gray-200 ${s.shadow} animate-pulse`}
      >
        <div className={`h-8 bg-gray-200 rounded mb-2 w-16`}></div>
        <div className={`h-4 bg-gray-200 rounded w-24`}></div>
      </div>
    )
  }

  return (
    <div
      className={`${s.padding} ${s.rounded} bg-white border border-gray-200 ${s.shadow} transition-all duration-200 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className={`${s.valueSize} font-black ${textColor}`}>
              {prefix}{typeof value === 'number' ? formatNumber(value) : value}{suffix}
            </p>
            {trend !== null && <TrendIndicator trend={trend} />}
          </div>
          <p className={`${s.labelSize} font-semibold text-gray-700 mt-1`}>{label}</p>
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="flex-shrink-0">
            <Sparkline
              data={sparklineData}
              width={64}
              height={28}
              color={textColor.replace('text-', '#').replace('-600', '')}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Trend indicator component
interface TrendIndicatorProps {
  trend: { direction: 'up' | 'down' | 'neutral'; percentage: number }
}

const TrendIndicator = ({ trend }: TrendIndicatorProps) => {
  const { direction, percentage } = trend

  if (direction === 'neutral') {
    return (
      <span className="inline-flex items-center text-xs font-medium text-gray-500">
        —
      </span>
    )
  }

  const isUp = direction === 'up'
  const colorClass = isUp ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
  const arrow = isUp ? '↑' : '↓'

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold ${colorClass}`}>
      {arrow} {Math.abs(percentage).toFixed(0)}%
    </span>
  )
}

// Utility functions
function calculateTrend(current: number, previous: number): { direction: 'up' | 'down' | 'neutral'; percentage: number } {
  if (previous === 0) {
    if (current === 0) return { direction: 'neutral', percentage: 0 }
    return { direction: 'up', percentage: 100 }
  }

  const percentChange = ((current - previous) / previous) * 100

  if (Math.abs(percentChange) < 0.5) {
    return { direction: 'neutral', percentage: 0 }
  }

  return {
    direction: percentChange > 0 ? 'up' : 'down',
    percentage: percentChange,
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

// Compact metric for inline display
interface CompactMetricProps {
  label: string
  value: number | string
  suffix?: string
  textColor?: string
}

export const CompactMetric = ({
  label,
  value,
  suffix = '',
  textColor = 'text-gray-900',
}: CompactMetricProps) => {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-lg font-bold ${textColor}`}>
        {typeof value === 'number' ? formatNumber(value) : value}{suffix}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
