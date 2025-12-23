'use client'

import { useState } from 'react'

export type TimeRange = '7d' | '30d' | '90d' | 'all'

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
]

export const TimeRangeSelector = ({ value, onChange }: TimeRangeSelectorProps) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
            ${value === range.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

// Utility functions for date range calculations
export const getDateRange = (range: TimeRange): { start: Date | null; end: Date } => {
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  if (range === 'all') {
    return { start: null, end }
  }

  const start = new Date()
  start.setHours(0, 0, 0, 0)

  switch (range) {
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
  }

  return { start, end }
}

export const getPreviousPeriodRange = (range: TimeRange): { start: Date | null; end: Date } | null => {
  if (range === 'all') {
    return null // No previous period for "all time"
  }

  const { start: currentStart } = getDateRange(range)
  if (!currentStart) return null

  const end = new Date(currentStart)
  end.setMilliseconds(end.getMilliseconds() - 1)

  const start = new Date(end)
  start.setHours(0, 0, 0, 0)

  switch (range) {
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
  }

  return { start, end }
}

export const getDaysInRange = (range: TimeRange): number => {
  switch (range) {
    case '7d':
      return 7
    case '30d':
      return 30
    case '90d':
      return 90
    case 'all':
      return 0 // Indicates all time
  }
}
