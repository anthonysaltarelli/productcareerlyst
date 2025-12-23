'use client'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
  showArea?: boolean
  className?: string
}

export const Sparkline = ({
  data,
  width = 80,
  height = 24,
  color = '#6366f1', // Indigo-500
  strokeWidth = 1.5,
  showArea = true,
  className = '',
}: SparklineProps) => {
  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs text-gray-400">—</span>
      </div>
    )
  }

  // Normalize data for the SVG viewbox
  const padding = 2
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const minValue = Math.min(...data)
  const maxValue = Math.max(...data)
  const valueRange = maxValue - minValue || 1 // Prevent division by zero

  // Generate points
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth
    const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight
    return { x, y }
  })

  // Create line path
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  // Create area path (for gradient fill)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`

  // Determine trend color
  const trend = data.length >= 2 ? data[data.length - 1] - data[0] : 0
  const trendColor = trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : color

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showArea && (
        <path
          d={areaPath}
          fill={`url(#sparkline-gradient-${color.replace('#', '')})`}
        />
      )}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={trendColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill={trendColor}
      />
    </svg>
  )
}

// Mini bar chart variant for status distributions
interface MiniBarChartProps {
  data: { label: string; value: number; color: string }[]
  height?: number
  className?: string
}

export const MiniBarChart = ({
  data,
  height = 12,
  className = '',
}: MiniBarChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-100 w-full ${className}`}
        style={{ height }}
      >
        <span className="text-xs text-gray-400">No data</span>
      </div>
    )
  }

  return (
    <div
      className={`w-full rounded-full overflow-hidden flex ${className}`}
      style={{ height }}
    >
      {data.map((item) => {
        if (item.value === 0) return null
        const widthPercent = (item.value / total) * 100

        return (
          <div
            key={item.label}
            style={{
              width: `${widthPercent}%`,
              backgroundColor: item.color,
              height: '100%'
            }}
          />
        )
      })}
    </div>
  )
}
