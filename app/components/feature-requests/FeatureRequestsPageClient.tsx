'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrackedButton } from '@/app/components/TrackedButton'
import { trackEvent } from '@/lib/amplitude/client'
import { ThumbsUp, Clock, CheckCircle, Archive, ArrowUp, Loader2, X, AlertCircle, Search, Sparkles } from 'lucide-react'

interface Profile {
  first_name: string
  last_name: string
}

interface FeatureRequest {
  id: string
  user_id: string
  title: string
  description: string
  status: 'under_review' | 'in_progress' | 'complete' | null
  is_archived: boolean
  created_at: string
  updated_at: string
  vote_count: number
  user_has_voted: boolean
  author: { first_name: string | null; last_name: string | null }
  is_own_request: boolean
}

interface FeatureRequestsPageClientProps {
  userId: string
  userEmail: string
  hasCompletedProfile: boolean
  initialProfile: Profile
  isAdmin: boolean
}

const STATUS_OPTIONS = [
  { value: '', label: 'New' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
]

const getStatusColor = (status: string | null) => {
  switch (status) {
    case 'under_review':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'complete':
      return 'bg-green-100 text-green-800 border-green-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

const getStatusIcon = (status: string | null) => {
  switch (status) {
    case 'under_review':
      return <Search className="w-3.5 h-3.5" />
    case 'in_progress':
      return <Clock className="w-3.5 h-3.5" />
    case 'complete':
      return <CheckCircle className="w-3.5 h-3.5" />
    default:
      return <Sparkles className="w-3.5 h-3.5" />
  }
}

const getStatusLabel = (status: string | null) => {
  switch (status) {
    case 'under_review':
      return 'Under Review'
    case 'in_progress':
      return 'In Progress'
    case 'complete':
      return 'Complete'
    default:
      return 'New'
  }
}

export const FeatureRequestsPageClient = ({
  userId,
  userEmail,
  hasCompletedProfile,
  initialProfile,
  isAdmin,
}: FeatureRequestsPageClientProps) => {
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [votingIds, setVotingIds] = useState<Set<string>>(new Set())
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileFirstName, setProfileFirstName] = useState(initialProfile.first_name || '')
  const [profileLastName, setProfileLastName] = useState(initialProfile.last_name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileComplete, setProfileComplete] = useState(hasCompletedProfile)

  // Admin view state
  const [showArchived, setShowArchived] = useState(false)

  // Load feature requests
  useEffect(() => {
    const fetchFeatureRequests = async () => {
      try {
        const endpoint = isAdmin && showArchived ? '/api/feature-requests/admin' : '/api/feature-requests'
        const response = await fetch(endpoint)
        
        if (!response.ok) {
          throw new Error('Failed to fetch feature requests')
        }
        
        const data = await response.json()
        setFeatureRequests(data.feature_requests || [])
      } catch (error) {
        console.error('Error fetching feature requests:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFeatureRequests()
  }, [isAdmin, showArchived])

  const handleProfileSave = async () => {
    if (!profileFirstName.trim() || !profileLastName.trim()) {
      setProfileError('Please enter both first and last name')
      return
    }

    setSavingProfile(true)
    setProfileError(null)

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          first_name: profileFirstName.trim(),
          last_name: profileLastName.trim(),
        }, {
          onConflict: 'user_id'
        })

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
      setFormSuccess('Profile updated! You can now submit feature requests.')
    } catch (error) {
      console.error('Error saving profile:', error)
      setProfileError('Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    // Check if profile is complete
    if (!profileComplete) {
      setShowProfileModal(true)
      return
    }

    // Validate form
    if (!title.trim()) {
      setFormError('Please enter a title')
      return
    }

    if (!description.trim()) {
      setFormError('Please enter a description')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresProfile) {
          setShowProfileModal(true)
          return
        }
        throw new Error(data.error || 'Failed to submit feature request')
      }

      trackEvent('User Submitted Feature Request', {
        'Feature Request Title': title.trim(),
        'Feature Request Description Length': description.trim().length,
        'Page Route': '/dashboard/feature-requests',
      })

      // Add new request to the list
      setFeatureRequests(prev => [data.feature_request, ...prev])
      
      // Reset form
      setTitle('')
      setDescription('')
      setFormSuccess('Feature request submitted successfully! Thank you for your feedback.')
    } catch (error) {
      console.error('Error submitting feature request:', error)
      setFormError(error instanceof Error ? error.message : 'Failed to submit feature request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (featureRequestId: string, hasVoted: boolean) => {
    if (votingIds.has(featureRequestId)) return

    setVotingIds(prev => new Set(prev).add(featureRequestId))

    try {
      const response = await fetch(`/api/feature-requests/${featureRequestId}/vote`, {
        method: hasVoted ? 'DELETE' : 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to vote')
      }

      trackEvent(hasVoted ? 'User Removed Feature Request Vote' : 'User Voted for Feature Request', {
        'Feature Request ID': featureRequestId,
        'Vote Count After': data.vote_count,
        'Page Route': '/dashboard/feature-requests',
      })

      // Update the feature request in the list
      setFeatureRequests(prev =>
        prev.map(fr =>
          fr.id === featureRequestId
            ? { ...fr, vote_count: data.vote_count, user_has_voted: data.user_has_voted }
            : fr
        )
      )
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setVotingIds(prev => {
        const next = new Set(prev)
        next.delete(featureRequestId)
        return next
      })
    }
  }

  const handleStatusChange = async (featureRequestId: string, newStatus: string) => {
    if (updatingIds.has(featureRequestId)) return

    setUpdatingIds(prev => new Set(prev).add(featureRequestId))

    try {
      const response = await fetch(`/api/feature-requests/${featureRequestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus === '' ? null : newStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status')
      }

      trackEvent('Admin Updated Feature Request Status', {
        'Feature Request ID': featureRequestId,
        'New Status': newStatus || 'null',
        'Page Route': '/dashboard/feature-requests',
      })

      // Update the feature request in the list
      setFeatureRequests(prev =>
        prev.map(fr =>
          fr.id === featureRequestId
            ? { ...fr, status: data.feature_request.status }
            : fr
        )
      )
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev)
        next.delete(featureRequestId)
        return next
      })
    }
  }

  const handleArchive = async (featureRequestId: string, archive: boolean) => {
    if (updatingIds.has(featureRequestId)) return

    setUpdatingIds(prev => new Set(prev).add(featureRequestId))

    try {
      const response = await fetch(`/api/feature-requests/${featureRequestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_archived: archive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to archive')
      }

      trackEvent(archive ? 'Admin Archived Feature Request' : 'Admin Unarchived Feature Request', {
        'Feature Request ID': featureRequestId,
        'Page Route': '/dashboard/feature-requests',
      })

      // Update or remove the feature request from the list
      if (showArchived) {
        setFeatureRequests(prev =>
          prev.map(fr =>
            fr.id === featureRequestId
              ? { ...fr, is_archived: archive }
              : fr
          )
        )
      } else {
        setFeatureRequests(prev => prev.filter(fr => fr.id !== featureRequestId))
      }
    } catch (error) {
      console.error('Error archiving:', error)
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev)
        next.delete(featureRequestId)
        return next
      })
    }
  }

  // Sort feature requests by vote count (descending)
  const sortedFeatureRequests = [...featureRequests].sort((a, b) => b.vote_count - a.vote_count)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-4 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
            Feature Requests
          </h1>
          <p className="text-gray-700 font-semibold text-sm md:text-base">
            Suggest new features and vote for the ones you&apos;d like to see
          </p>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-[1.5rem] p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-amber-800 font-bold text-sm">🔧 Admin Mode</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-amber-800 font-semibold text-sm">Show Archived</span>
              </label>
            </div>
          </div>
        )}

        {/* Submit Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-4 md:p-6 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200 mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-4">
            Submit a Feature Request
          </h2>
          
          {formSuccess && (
            <div className="mb-4 p-4 bg-green-100 text-green-800 border-2 border-green-300 rounded-[1rem] font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {formSuccess}
            </div>
          )}

          {formError && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 border-2 border-red-300 rounded-[1rem] font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a brief title for your feature request"
                className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
                maxLength={200}
                aria-label="Feature request title"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the feature you'd like to see. What problem would it solve? How would it help you?"
                rows={4}
                className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold resize-none"
                maxLength={2000}
                aria-label="Feature request description"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {description.length}/2000
              </p>
            </div>

            <TrackedButton
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)]"
              eventName="User Clicked Submit Feature Request Button"
              buttonId="feature-requests-submit-button"
              eventProperties={{
                'Button Section': 'Feature Request Form',
                'Button Position': 'Bottom of Form',
                'Button Text': submitting ? 'Submitting...' : 'Submit Feature Request',
                'Button Type': 'Primary Form Submit',
                'Button Context': 'Feature request submission form',
                'Page Route': '/dashboard/feature-requests',
              }}
              tabIndex={0}
              aria-label="Submit feature request"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Feature Request'
              )}
            </TrackedButton>
          </form>
        </div>

        {/* Feature Requests List */}
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-gray-800">
            All Requests ({sortedFeatureRequests.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : sortedFeatureRequests.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-200 text-center">
              <p className="text-gray-600 font-semibold">
                No feature requests yet. Be the first to submit one!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedFeatureRequests.map((request) => (
                <div
                  key={request.id}
                  className={`bg-white/80 backdrop-blur-sm rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-[0_6px_0_0_rgba(0,0,0,0.08)] border-2 ${
                    request.is_archived ? 'border-gray-300 opacity-60' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Vote Section */}
                    <div className="flex md:flex-col items-center justify-center md:justify-start gap-2 md:gap-1 order-2 md:order-1">
                      <button
                        onClick={() => handleVote(request.id, request.user_has_voted)}
                        disabled={votingIds.has(request.id)}
                        className={`group flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-[1rem] border-2 transition-all duration-200 ${
                          request.user_has_voted
                            ? 'bg-purple-100 border-purple-400 text-purple-600'
                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label={request.user_has_voted ? 'Remove vote' : 'Vote for this feature'}
                        tabIndex={0}
                      >
                        {votingIds.has(request.id) ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ArrowUp className={`w-5 h-5 ${request.user_has_voted ? '' : 'group-hover:scale-110'} transition-transform`} />
                        )}
                      </button>
                      <span className={`text-lg md:text-xl font-black ${request.user_has_voted ? 'text-purple-600' : 'text-gray-600'}`}>
                        {request.vote_count}
                      </span>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 order-1 md:order-2">
                      <div className="flex flex-wrap items-start gap-2 mb-2">
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 break-words">
                          {request.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {getStatusLabel(request.status)}
                        </span>
                        {request.is_archived && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
                            <Archive className="w-3.5 h-3.5" />
                            Archived
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 font-medium text-sm md:text-base whitespace-pre-wrap mb-3 break-words">
                        {request.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-500">
                        <span className="font-semibold">
                          {request.author.first_name || request.author.last_name
                            ? `${request.author.first_name || ''} ${request.author.last_name || ''}`.trim()
                            : 'A community member'}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(request.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {request.is_own_request && (
                          <>
                            <span>•</span>
                            <span className="text-purple-600 font-semibold">Your request</span>
                          </>
                        )}
                      </div>

                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
                          <select
                            value={request.status || ''}
                            onChange={(e) => handleStatusChange(request.id, e.target.value)}
                            disabled={updatingIds.has(request.id)}
                            className="px-3 py-2 rounded-[0.75rem] border-2 border-gray-300 text-sm font-semibold focus:border-purple-500 focus:outline-none disabled:opacity-50 bg-white"
                            aria-label="Change status"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleArchive(request.id, !request.is_archived)}
                            disabled={updatingIds.has(request.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-[0.75rem] border-2 text-sm font-semibold transition-all duration-200 ${
                              request.is_archived
                                ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            aria-label={request.is_archived ? 'Unarchive' : 'Archive'}
                            tabIndex={0}
                          >
                            {updatingIds.has(request.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
                            {request.is_archived ? 'Unarchive' : 'Archive'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 font-medium mb-6">
              To submit a feature request, please add your first and last name to your profile.
            </p>

            {profileError && (
              <div className="mb-4 p-4 bg-red-100 text-red-800 border-2 border-red-300 rounded-[1rem] font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {profileError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="profile-first-name"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="profile-first-name"
                  value={profileFirstName}
                  onChange={(e) => setProfileFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
                  aria-label="First name"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-last-name"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="profile-last-name"
                  value={profileLastName}
                  onChange={(e) => setProfileLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
                  aria-label="Last name"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-3 rounded-[1rem] border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <TrackedButton
                  onClick={handleProfileSave}
                  disabled={savingProfile}
                  className="flex-1 px-4 py-3 rounded-[1rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_4px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(147,51,234,0.6)] font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  eventName="User Saved Profile from Feature Request Modal"
                  buttonId="feature-requests-profile-modal-save-button"
                  eventProperties={{
                    'Button Section': 'Profile Completion Modal',
                    'Button Position': 'Modal Footer',
                    'Button Text': savingProfile ? 'Saving...' : 'Save & Continue',
                    'Button Type': 'Primary Modal Submit',
                    'Button Context': 'Profile completion modal for feature requests',
                    'Page Route': '/dashboard/feature-requests',
                  }}
                  tabIndex={0}
                  aria-label="Save profile"
                >
                  {savingProfile ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save & Continue'
                  )}
                </TrackedButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

