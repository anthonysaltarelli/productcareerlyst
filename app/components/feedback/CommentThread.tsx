'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { CommentItem } from './CommentItem'
import type { FeedbackComment } from '@/lib/types/feedback'

interface CommentThreadProps {
  comments: FeedbackComment[]
  feedbackId: string
  onAddComment: (feedbackId: string, content: string) => Promise<void>
  onEditComment: (commentId: string, content: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  isLoading?: boolean
}

export function CommentThread({
  comments,
  feedbackId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  isLoading = false,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onAddComment(feedbackId, newComment.trim())
      setNewComment('')
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Comments ({comments.length})
      </h3>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
            />
          ))}
        </div>
      )}

      {/* Add comment input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          className="flex-1 px-4 py-3 rounded-[1rem] border-2 border-gray-200 focus:border-purple-500 focus:outline-none font-medium"
          maxLength={2000}
          disabled={isSubmitting}
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
          className="px-6 py-3 rounded-[1rem] bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Post'
          )}
        </button>
      </div>
    </div>
  )
}
