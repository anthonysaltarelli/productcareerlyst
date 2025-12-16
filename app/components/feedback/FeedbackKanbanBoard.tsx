'use client'

import { useState } from 'react'
import { FeedbackColumn } from './FeedbackColumn'
import { getDisplayStatus, type FeedbackItem, type FeedbackStatus, type VoteType } from '@/lib/types/feedback'

interface FeedbackKanbanBoardProps {
  feedbackItems: FeedbackItem[]
  onCardClick: (feedback: FeedbackItem) => void
  onVote: (feedbackId: string, voteType: VoteType) => void
  onRemoveVote: (feedbackId: string) => void
  votingIds: Set<string>
  showArchived?: boolean
}

export function FeedbackKanbanBoard({
  feedbackItems,
  onCardClick,
  onVote,
  onRemoveVote,
  votingIds,
  showArchived = false,
}: FeedbackKanbanBoardProps) {
  const [isArchivedCollapsed, setIsArchivedCollapsed] = useState(false)

  // Group items by status
  const getItemsByStatus = (status: FeedbackStatus): FeedbackItem[] => {
    return feedbackItems.filter((item) => {
      const displayStatus = getDisplayStatus(item.status)
      // Don't show archived items unless showArchived is true
      if (displayStatus === 'archived' && !showArchived) {
        return false
      }
      // Items with is_archived = true should go to archived column
      if (item.is_archived) {
        return status === 'archived'
      }
      // Items with null status go to 'evaluating'
      if (item.status === null) {
        return status === 'evaluating'
      }
      return displayStatus === status
    })
  }

  const evaluatingItems = getItemsByStatus('evaluating')
  const inProgressItems = getItemsByStatus('in_progress')
  const shippedItems = getItemsByStatus('shipped')
  const archivedItems = showArchived ? getItemsByStatus('archived') : []

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${showArchived ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 pb-4`}>
      <FeedbackColumn
        status="evaluating"
        items={evaluatingItems}
        onCardClick={onCardClick}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
        votingIds={votingIds}
      />
      <FeedbackColumn
        status="in_progress"
        items={inProgressItems}
        onCardClick={onCardClick}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
        votingIds={votingIds}
      />
      <FeedbackColumn
        status="shipped"
        items={shippedItems}
        onCardClick={onCardClick}
        onVote={onVote}
        onRemoveVote={onRemoveVote}
        votingIds={votingIds}
      />
      {showArchived && (
        <FeedbackColumn
          status="archived"
          items={archivedItems}
          onCardClick={onCardClick}
          onVote={onVote}
          onRemoveVote={onRemoveVote}
          votingIds={votingIds}
          isCollapsible
          isCollapsed={isArchivedCollapsed}
          onToggleCollapse={() => setIsArchivedCollapsed(!isArchivedCollapsed)}
        />
      )}
    </div>
  )
}
