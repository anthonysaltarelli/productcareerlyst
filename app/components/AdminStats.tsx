'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Users, Calendar } from 'lucide-react'

interface StatsData {
  newUsersToday: number
  newUsersThisWeek: number
}

export const AdminStats = () => {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        setStats(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching admin stats:', err)
        setError('Failed to load statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-semibold">Error</p>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New Users Today */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">New Users Today</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.newUsersToday ?? 0}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Verified users only (have signed in), excluding test accounts
          </p>
        </div>

        {/* New Users This Week */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">New Users This Week</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.newUsersThisWeek ?? 0}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Verified users only (have signed in), since Monday, excluding test accounts
          </p>
        </div>
      </div>

      {/* Stats Section Header */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Statistics</h2>
        </div>
        <p className="text-sm text-gray-600">
          User registration metrics for monitoring growth and engagement.
        </p>
      </div>
    </div>
  )
}

