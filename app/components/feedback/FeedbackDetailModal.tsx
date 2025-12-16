'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Pencil } from 'lucide-react'
import { VoteButtons } from './VoteButtons'
import { CommentThread } from './CommentThread'
import {
  CATEGORY_CONFIG,
  FEATURE_CONFIG,
  STATUS_CONFIG,
  getDisplayStatus,
  type FeedbackItem,
  type FeedbackComment,
  type VoteType,
} from '@/lib/types/feedback'

interface FeedbackDetailModalProps {
  feedback: FeedbackItem | null
  isOpen: boolean
  onClose: () => void
  onVote: (feedbackId: string, voteType: VoteType) => void
  onRemoveVote: (feedbackId: string) => void
  onEdit: () => void
  isVoting?: boolean
}

export function FeedbackDetailModal({
  feedback,
  isOpen,
  onClose,
  onVote,
  onRemoveVote,
  onEdit,
  isVoting = false,
}: FeedbackDetailModalProps) {
  const [comments, setComments] = useState<FeedbackComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen && feedback) {
      fetchComments()
    } else {
      setComments([])
    }
  }, [isOpen, feedback?.id])

  const fetchComments = async () => {
    if (!feedback) return

    setIsLoadingComments(true)
    setCommentError(null)

    try {
      const response = await fetch(`/api/feature-requests/${feedback.id}/comments`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments')
      }

      setComments(data.comments || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
      setCommentError('Failed to load comments')
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleAddComment = async (feedbackId: string, content: string) => {
    const response = await fetch(`/api/feature-requests/${feedbackId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add comment')
    }

    setComments((prev) => [...prev, data.comment])
  }

  const handleEditComment = async (commentId: string, content: string) => {
    const response = await fetch(`/api/feature-requests/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to edit comment')
    }

    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? data.comment : c))
    )
  }

  const handleDeleteComment = async (commentId: string) => {
    const response = await fetch(`/api/feature-requests/comments/${commentId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to delete comment')
    }

    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  if (!isOpen || !feedback) return null

  const categoryConfig = CATEGORY_CONFIG[feedback.category]
  const featureConfig = FEATURE_CONFIG[feedback.related_feature]
  const statusConfig = STATUS_CONFIG[getDisplayStatus(feedback.status)]

  // Get initials for avatar
  const getInitials = () => {
    const first = feedback.author.first_name?.[0] || ''
    const last = feedback.author.last_name?.[0] || ''
    return `${first}${last}`.toUpperCase() || '?'
  }

  const getAuthorName = () => {
    if (feedback.author.first_name || feedback.author.last_name) {
      return `${feedback.author.first_name || ''} ${feedback.author.last_name || ''}`.trim()
    }
    return 'Anonymous'
  }

  // Generate a consistent gradient based on user_id
  const getAvatarGradient = () => {
    const gradients = [
      'from-blue-400 to-purple-500',
      'from-green-400 to-teal-500',
      'from-pink-400 to-rose-500',
      'from-yellow-400 to-orange-500',
      'from-indigo-400 to-purple-500',
      'from-red-400 to-pink-500',
      'from-teal-400 to-cyan-500',
      'from-amber-400 to-orange-500',
      'from-violet-400 to-purple-500',
    ]
    const hash = feedback.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return gradients[hash % gradients.length]
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 md:p-8 pb-4 flex-shrink-0 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${categoryConfig.bgColor} ${categoryConfig.color} border ${categoryConfig.borderColor}`}
                >
                  {categoryConfig.label}
                </span>
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-semibold ${featureConfig.bgColor} ${featureConfig.color}`}
                >
                  {featureConfig.label}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-gray-800">
                {feedback.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
          {/* Original Post */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-sm font-bold text-white`}
              >
                {getInitials()}
              </div>
              <div>
                <p className="font-bold text-gray-800">{getAuthorName()}</p>
                <p className="text-xs text-gray-500">
                  Posted{' '}
                  {new Date(feedback.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              {feedback.is_own_request && (
                <button
                  onClick={onEdit}
                  className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit feedback"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>

            <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
              {feedback.description}
            </p>

            <div className="flex items-center gap-4 mt-4">
              <VoteButtons
                feedbackId={feedback.id}
                voteCount={feedback.vote_count}
                upvoteCount={feedback.upvote_count}
                downvoteCount={feedback.downvote_count}
                userVoteType={feedback.user_vote_type}
                onVote={onVote}
                onRemoveVote={onRemoveVote}
                isVoting={isVoting}
              />
            </div>
          </div>

          {/* Comments Section */}
          {commentError ? (
            <div className="text-center py-6 text-red-500">{commentError}</div>
          ) : (
            <CommentThread
              comments={comments}
              feedbackId={feedback.id}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              isLoading={isLoadingComments}
            />
          )}
        </div>
      </div>
    </div>
  )
}
