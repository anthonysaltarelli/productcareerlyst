'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, X, AlertCircle, CheckCircle } from 'lucide-react'
import { trackEvent } from '@/lib/amplitude/client'
import { createClient } from '@/lib/supabase/client'
import { CategoryFilter } from './CategoryFilter'
import { FeedbackKanbanBoard } from './FeedbackKanbanBoard'
import { NewFeedbackModal } from './NewFeedbackModal'
import { FeedbackDetailModal } from './FeedbackDetailModal'
import { EditFeedbackModal } from './EditFeedbackModal'
import type {
  FeedbackItem,
  FeedbackCategory,
  RelatedFeature,
  VoteType,
} from '@/lib/types/feedback'

interface Profile {
  first_name: string
  last_name: string
}

interface ProductFeedbackPageClientProps {
  userId: string
  userEmail: string
  hasCompletedProfile: boolean
  initialProfile: Profile
  isAdmin: boolean
}

export function ProductFeedbackPageClient({
  userId,
  hasCompletedProfile,
  initialProfile,
  isAdmin,
}: ProductFeedbackPageClientProps) {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [votingIds, setVotingIds] = useState<Set<string>>(new Set())

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all')
  const [showArchived, setShowArchived] = useState(false)

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileFirstName, setProfileFirstName] = useState(initialProfile.first_name || '')
  const [profileLastName, setProfileLastName] = useState(initialProfile.last_name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileComplete, setProfileComplete] = useState(hasCompletedProfile)

  // Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Load feedback items
  useEffect(() => {
    fetchFeedbackItems()
  }, [])

  const fetchFeedbackItems = async () => {
    try {
      const endpoint = isAdmin && showArchived
        ? '/api/feature-requests/admin'
        : '/api/feature-requests'
      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error('Failed to fetch feedback')
      }

      const data = await response.json()
      setFeedbackItems(data.feature_requests || [])
    } catch (error) {
      console.error('Error fetching feedback:', error)
      setErrorMessage('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  // Refetch when showArchived changes
  useEffect(() => {
    if (isAdmin) {
      setLoading(true)
      fetchFeedbackItems()
    }
  }, [showArchived, isAdmin])

  // Filter items by category
  const filteredItems = feedbackItems.filter((item) => {
    if (categoryFilter === 'all') return true
    return item.category === categoryFilter
  })

  // Handle profile save
  const handleProfileSave = async () => {
    if (!profileFirstName.trim() || !profileLastName.trim()) {
      setProfileError('Please enter both first and last name')
      return
    }

    setSavingProfile(true)
    setProfileError(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.from('profiles').upsert(
        {
          user_id: userId,
          first_name: profileFirstName.trim(),
          last_name: profileLastName.trim(),
        },
        { onConflict: 'user_id' }
      )

      if (error) {
        setProfileError(error.message)
        return
      }

      trackEvent('User Completed Profile for Feature Request', {
        'First Name Filled': true,
        'Last Name Filled': true,
        'Page Route': '/dashboard/feature-requests',
      })

      setProfileComplete(true)
      setShowProfileModal(false)
      setSuccessMessage('Profile updated! You can now submit feedback.')
    } catch (error) {
      console.error('Error saving profile:', error)
      setProfileError('Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle new feedback submission
  const handleNewFeedback = async (data: {
    title: string
    description: string
    category: FeedbackCategory
    related_feature: RelatedFeature
  }) => {
    if (!profileComplete) {
      setShowProfileModal(true)
      return
    }

    const response = await fetch('/api/feature-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      if (result.requiresProfile) {
        setShowProfileModal(true)
        return
      }
      throw new Error(result.error || 'Failed to submit feedback')
    }

    trackEvent('User Submitted Feature Request', {
      'Feature Request Title': data.title,
      'Feature Request Category': data.category,
      'Feature Request Feature': data.related_feature,
      'Page Route': '/dashboard/feature-requests',
    })

    setFeedbackItems((prev) => [result.feature_request, ...prev])
    setSuccessMessage('Feedback submitted successfully!')
  }

  // Handle vote
  const handleVote = async (feedbackId: string, voteType: VoteType) => {
    if (votingIds.has(feedbackId)) return

    setVotingIds((prev) => new Set(prev).add(feedbackId))

    try {
      const response = await fetch(`/api/feature-requests/${feedbackId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to vote')
      }

      trackEvent('User Voted for Feature Request', {
        'Feature Request ID': feedbackId,
        'Vote Type': voteType,
        'Vote Count After': data.vote_count,
        'Page Route': '/dashboard/feature-requests',
      })

      // Update the feedback item in the list
      setFeedbackItems((prev) =>
        prev.map((item) =>
          item.id === feedbackId
            ? {
                ...item,
                vote_count: data.vote_count,
                upvote_count: data.upvote_count,
                downvote_count: data.downvote_count,
                user_vote_type: data.user_vote_type,
              }
            : item
        )
      )

      // Update selected feedback if open
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback((prev) =>
          prev
            ? {
                ...prev,
                vote_count: data.vote_count,
                upvote_count: data.upvote_count,
                downvote_count: data.downvote_count,
                user_vote_type: data.user_vote_type,
              }
            : null
        )
      }
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setVotingIds((prev) => {
        const next = new Set(prev)
        next.delete(feedbackId)
        return next
      })
    }
  }

  // Handle remove vote
  const handleRemoveVote = async (feedbackId: string) => {
    if (votingIds.has(feedbackId)) return

    setVotingIds((prev) => new Set(prev).add(feedbackId))

    try {
      const response = await fetch(`/api/feature-requests/${feedbackId}/vote`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove vote')
      }

      trackEvent('User Removed Feature Request Vote', {
        'Feature Request ID': feedbackId,
        'Vote Count After': data.vote_count,
        'Page Route': '/dashboard/feature-requests',
      })

      // Update the feedback item in the list
      setFeedbackItems((prev) =>
        prev.map((item) =>
          item.id === feedbackId
            ? {
                ...item,
                vote_count: data.vote_count,
                upvote_count: data.upvote_count,
                downvote_count: data.downvote_count,
                user_vote_type: null,
              }
            : item
        )
      )

      // Update selected feedback if open
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback((prev) =>
          prev
            ? {
                ...prev,
                vote_count: data.vote_count,
                upvote_count: data.upvote_count,
                downvote_count: data.downvote_count,
                user_vote_type: null,
              }
            : null
        )
      }
    } catch (error) {
      console.error('Error removing vote:', error)
    } finally {
      setVotingIds((prev) => {
        const next = new Set(prev)
        next.delete(feedbackId)
        return next
      })
    }
  }

  // Handle card click
  const handleCardClick = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback)
    setIsDetailModalOpen(true)
  }

  // Handle edit
  const handleEdit = () => {
    setIsDetailModalOpen(false)
    setIsEditModalOpen(true)
  }

  // Handle edit submit
  const handleEditSubmit = async (
    feedbackId: string,
    data: { title: string; description: string }
  ) => {
    const response = await fetch(`/api/feature-requests/${feedbackId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update feedback')
    }

    trackEvent('User Edited Feature Request', {
      'Feature Request ID': feedbackId,
      'Page Route': '/dashboard/feature-requests',
    })

    // Update the feedback item in the list
    setFeedbackItems((prev) =>
      prev.map((item) =>
        item.id === feedbackId
          ? { ...item, ...result.feature_request }
          : item
      )
    )

    // Update selected feedback
    if (selectedFeedback?.id === feedbackId) {
      setSelectedFeedback((prev) =>
        prev ? { ...prev, ...result.feature_request } : null
      )
    }

    setSuccessMessage('Feedback updated successfully!')
  }

  // Handle new feedback button click
  const handleNewFeedbackClick = () => {
    if (!profileComplete) {
      setShowProfileModal(true)
      return
    }
    setIsNewModalOpen(true)
  }

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 lg:p-12">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-green-100 text-green-800 border-2 border-green-300 rounded-[1rem] font-semibold flex items-center gap-2 shadow-lg max-w-md">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {successMessage}
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-2 text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-red-100 text-red-800 border-2 border-red-300 rounded-[1rem] font-semibold flex items-center gap-2 shadow-lg max-w-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMessage}
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
          Product Feedback
        </h1>
        <p className="text-gray-600 font-medium">
          Share ideas, report bugs, and vote on features you want to see
        </p>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-[1.5rem] p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-amber-800 font-bold text-sm">Admin Mode</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-amber-800 font-semibold text-sm">
                Show Archived
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Filters */}
        <CategoryFilter
          selectedCategory={categoryFilter}
          onCategoryChange={setCategoryFilter}
        />

        {/* New Request Button */}
        <button
          onClick={handleNewFeedbackClick}
          className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-600 to-pink-500 text-white font-bold shadow-[0_6px_0_0_rgba(147,51,234,0.3)] hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.3)] transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Feedback
        </button>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <FeedbackKanbanBoard
          feedbackItems={filteredItems}
          onCardClick={handleCardClick}
          onVote={handleVote}
          onRemoveVote={handleRemoveVote}
          votingIds={votingIds}
          showArchived={showArchived}
        />
      )}

      {/* New Feedback Modal */}
      <NewFeedbackModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleNewFeedback}
      />

      {/* Feedback Detail Modal */}
      <FeedbackDetailModal
        feedback={selectedFeedback}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedFeedback(null)
        }}
        onVote={handleVote}
        onRemoveVote={handleRemoveVote}
        onEdit={handleEdit}
        isVoting={selectedFeedback ? votingIds.has(selectedFeedback.id) : false}
      />

      {/* Edit Feedback Modal */}
      <EditFeedbackModal
        feedback={selectedFeedback}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
      />

      {/* Profile Completion Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProfileModal(false)
          }}
        >
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-800">
                Complete Your Profile
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 font-medium mb-6">
              To submit feedback, please add your first and last name to your
              profile.
            </p>

            {profileError && (
              <div className="mb-4 p-4 bg-red-100 text-red-800 border-2 border-red-300 rounded-[1rem] font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {profileError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileFirstName}
                  onChange={(e) => setProfileFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileLastName}
                  onChange={(e) => setProfileLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-3 rounded-[1rem] border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileSave}
                  disabled={savingProfile}
                  className="flex-1 px-4 py-3 rounded-[1rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_4px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(147,51,234,0.6)] font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingProfile ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save & Continue'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
