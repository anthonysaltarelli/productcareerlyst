'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Check, X } from 'lucide-react'

interface User {
  id: string
  email: string
  createdAt: string
  lastSignInAt: string | null
  fullName: string | null
  linkedin: string | null
  subscriptionPlan: string | null
  subscriptionStatus: string | null
  stripeCustomerId: string | null
  onboardingCompleted: boolean
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  }
  
  return date.toLocaleString('en-US', options)
}

export const AdminUsersTable = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/users')
        
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }

        const data = await response.json()
        setUsers(data.users || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
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

  // Filter users based on selected filters
  const filteredUsers = users.filter((user) => {
    // Filter by plan
    if (selectedPlan !== 'all') {
      if (selectedPlan === 'none' && user.subscriptionPlan !== null) {
        return false
      }
      if (selectedPlan !== 'none' && user.subscriptionPlan !== selectedPlan) {
        return false
      }
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'none' && user.subscriptionStatus !== null) {
        return false
      }
      if (selectedStatus !== 'none' && user.subscriptionStatus !== selectedStatus) {
        return false
      }
    }

    return true
  })

  const hasActiveFilters = selectedPlan !== 'all' || selectedStatus !== 'all'

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Users</h2>
            <p className="text-sm text-gray-600 mt-1">
              {hasActiveFilters
                ? `Showing ${filteredUsers.length} of ${users.length} users`
                : `Last 100 users (excluding test accounts)`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="plan-filter" className="text-sm font-medium text-gray-700">
              Plan:
            </label>
            <select
              id="plan-filter"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="learn">Learn</option>
              <option value="accelerate">Accelerate</option>
              <option value="none">None</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Status:
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="canceled">Canceled</option>
              <option value="past_due">Past Due</option>
              <option value="incomplete">Incomplete</option>
              <option value="incomplete_expired">Incomplete Expired</option>
              <option value="unpaid">Unpaid</option>
              <option value="paused">Paused</option>
              <option value="none">None</option>
            </select>
          </div>
          {(hasActiveFilters) && (
            <button
              onClick={() => {
                setSelectedPlan('all')
                setSelectedStatus('all')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Full Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                LinkedIn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stripe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Onboarding
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Signed In
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  {hasActiveFilters
                    ? 'No users match the selected filters'
                    : 'No users found'
                  }
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.fullName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.linkedin ? (
                      <a
                        href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.subscriptionPlan === 'accelerate' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.subscriptionPlan === 'learn'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.subscriptionPlan || 'None'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.subscriptionStatus === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.subscriptionStatus === 'trialing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : user.subscriptionStatus === 'canceled'
                        ? 'bg-red-100 text-red-800'
                        : user.subscriptionStatus
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.subscriptionStatus || 'None'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.stripeCustomerId ? (
                      <a
                        href={`https://dashboard.stripe.com/customers/${user.stripeCustomerId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.onboardingCompleted ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="w-4 h-4" />
                        <span>Yes</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400">
                        <X className="w-4 h-4" />
                        <span>No</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.lastSignInAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

