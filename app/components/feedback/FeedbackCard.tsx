'use client'

import { MessageCircle } from 'lucide-react'
import { VoteButtons } from './VoteButtons'
import { CATEGORY_CONFIG, FEATURE_CONFIG, type FeedbackItem, type VoteType } from '@/lib/types/feedback'

interface FeedbackCardProps {
  feedback: FeedbackItem
  onClick: () => void
  onVote: (feedbackId: string, voteType: VoteType) => void
  onRemoveVote: (feedbackId: string) => void
  isVoting?: boolean
}

export function FeedbackCard({
  feedback,
  onClick,
  onVote,
  onRemoveVote,
  isVoting = false,
}: FeedbackCardProps) {
  const categoryConfig = CATEGORY_CONFIG[feedback.category]
  const featureConfig = FEATURE_CONFIG[feedback.related_feature]

  // Get initials for avatar
  const getInitials = () => {
    const first = feedback.author.first_name?.[0] || ''
    const last = feedback.author.last_name?.[0] || ''
    return `${first}${last}`.toUpperCase() || '?'
  }

  const getAuthorName = () => {
    if (feedback.author.first_name || feedback.author.last_name) {
      return `${feedback.author.first_name || ''} ${feedback.author.last_name?.[0] || ''}.`.trim()
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
      onClick={onClick}
      className="bg-white rounded-[1.5rem] p-5 border-2 border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] hover:border-purple-300 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.1)] transition-all cursor-pointer"
    >
      {/* Header: Category + Feature badges */}
      <div className="flex items-start justify-between gap-2 mb-3">
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
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-800 mb-2">{feedback.title}</h3>

      {/* Description (truncated) */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{feedback.description}</p>

      {/* Footer: Votes, Comments, Author */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Upvote button */}
          <div onClick={(e) => e.stopPropagation()}>
            <VoteButtons
              feedbackId={feedback.id}
              voteCount={feedback.vote_count}
              upvoteCount={feedback.upvote_count}
              downvoteCount={feedback.downvote_count}
              userVoteType={feedback.user_vote_type}
              onVote={onVote}
              onRemoveVote={onRemoveVote}
              isVoting={isVoting}
              compact
            />
          </div>

          {/* Comments count */}
          <button
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">{feedback.comment_count}</span>
          </button>
        </div>

        {/* Author */}
        <div
          className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-[10px] font-bold text-white`}
          title={getAuthorName()}
        >
          {getInitials()}
        </div>
      </div>

      {/* Shipped date (if applicable) */}
      {feedback.status === 'shipped' && (
        <div className="mt-3 pt-3 border-t border-green-100">
          <span className="text-xs font-semibold text-green-600">
            Shipped{' '}
            {new Date(feedback.updated_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  )
}
