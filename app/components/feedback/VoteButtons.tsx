'use client'

import { Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import type { VoteType } from '@/lib/types/feedback'

interface VoteButtonsProps {
  feedbackId: string
  voteCount: number
  upvoteCount: number
  downvoteCount: number
  userVoteType: VoteType | null
  onVote: (feedbackId: string, voteType: VoteType) => void
  onRemoveVote: (feedbackId: string) => void
  isVoting?: boolean
  compact?: boolean
}

export function VoteButtons({
  feedbackId,
  voteCount,
  userVoteType,
  onVote,
  onRemoveVote,
  isVoting = false,
  compact = false,
}: VoteButtonsProps) {
  const handleUpvote = () => {
    if (isVoting) return
    if (userVoteType === 'upvote') {
      onRemoveVote(feedbackId)
    } else {
      onVote(feedbackId, 'upvote')
    }
  }

  const handleDownvote = () => {
    if (isVoting) return
    if (userVoteType === 'downvote') {
      onRemoveVote(feedbackId)
    } else {
      onVote(feedbackId, 'downvote')
    }
  }

  if (compact) {
    // Compact version for cards - just upvote button with count
    return (
      <button
        onClick={handleUpvote}
        disabled={isVoting}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
          userVoteType === 'upvote'
            ? 'bg-purple-50 border-purple-200 text-purple-600'
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={userVoteType === 'upvote' ? 'Remove upvote' : 'Upvote'}
      >
        {isVoting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
        <span className="text-sm font-bold">{voteCount}</span>
      </button>
    )
  }

  // Full version for detail modal - both upvote and downvote
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleUpvote}
        disabled={isVoting}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
          userVoteType === 'upvote'
            ? 'bg-purple-50 border-purple-200 text-purple-600'
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-purple-100 hover:border-purple-300 hover:text-purple-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={userVoteType === 'upvote' ? 'Remove upvote' : 'Upvote'}
      >
        {isVoting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ChevronUp className="w-5 h-5" />
        )}
        <span className="font-bold">{voteCount >= 0 ? voteCount : 0}</span>
      </button>
      <button
        onClick={handleDownvote}
        disabled={isVoting}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
          userVoteType === 'downvote'
            ? 'bg-red-50 border-red-200 text-red-600'
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={userVoteType === 'downvote' ? 'Remove downvote' : 'Downvote'}
      >
        {isVoting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}
