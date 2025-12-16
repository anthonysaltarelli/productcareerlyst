'use client'

import { ChevronDown } from 'lucide-react'
import { FeedbackCard } from './FeedbackCard'
import { STATUS_CONFIG, type FeedbackItem, type FeedbackStatus, type VoteType } from '@/lib/types/feedback'

interface FeedbackColumnProps {
  status: NonNullable<FeedbackStatus>
  items: FeedbackItem[]
  onCardClick: (feedback: FeedbackItem) => void
  onVote: (feedbackId: string, voteType: VoteType) => void
  onRemoveVote: (feedbackId: string) => void
  votingIds: Set<string>
  isCollapsible?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function FeedbackColumn({
  status,
  items,
  onCardClick,
  onVote,
  onRemoveVote,
  votingIds,
  isCollapsible = false,
  isCollapsed = false,
  onToggleCollapse,
}: FeedbackColumnProps) {
  const config = STATUS_CONFIG[status]

  // Sort items by vote count (descending)
  const sortedItems = [...items].sort((a, b) => b.vote_count - a.vote_count)

  return (
    <div className={`min-w-[300px] ${status === 'archived' ? 'opacity-60' : ''}`}>
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${config.dotColor}`}></div>
        <h2 className={`text-lg font-bold ${status === 'archived' ? 'text-gray-500' : 'text-gray-800'}`}>
          {config.label}
        </h2>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${config.color}`}
        >
          {items.length}
        </span>
        {isCollapsible && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Cards */}
      {(!isCollapsible || !isCollapsed) && (
        <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin pr-2">
          {sortedItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm font-medium">
              No items
            </div>
          ) : (
            sortedItems.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onClick={() => onCardClick(feedback)}
                onVote={onVote}
                onRemoveVote={onRemoveVote}
                isVoting={votingIds.has(feedback.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
