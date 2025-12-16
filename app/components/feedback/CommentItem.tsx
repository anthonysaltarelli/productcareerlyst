'use client'

import { useState } from 'react'
import { Pencil, Trash2, MoreVertical, Loader2, X, Check } from 'lucide-react'
import type { FeedbackComment } from '@/lib/types/feedback'

interface CommentItemProps {
  comment: FeedbackComment
  onEdit: (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
}

export function CommentItem({ comment, onEdit, onDelete }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Get initials for avatar
  const getInitials = () => {
    const first = comment.author.first_name?.[0] || ''
    const last = comment.author.last_name?.[0] || ''
    return `${first}${last}`.toUpperCase() || '?'
  }

  const getAuthorName = () => {
    if (comment.is_own_comment) return 'You'
    if (comment.author.first_name || comment.author.last_name) {
      return `${comment.author.first_name || ''} ${comment.author.last_name || ''}`.trim()
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
    const hash = comment.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return gradients[hash % gradients.length]
  }

  const getRelativeTime = () => {
    const now = new Date()
    const created = new Date(comment.created_at)
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleSave = async () => {
    if (!editContent.trim() || editContent.trim() === comment.content) {
      setIsEditing(false)
      setEditContent(comment.content)
      return
    }

    setIsSaving(true)
    try {
      await onEdit(comment.id, editContent.trim())
      setIsEditing(false)
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(comment.id)
    } catch {
      // Error handled by parent
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditContent(comment.content)
  }

  return (
    <div
      className={`rounded-[1.5rem] p-4 ${
        comment.is_own_comment
          ? 'bg-purple-50 border border-purple-200'
          : 'bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-[10px] font-bold text-white`}
        >
          {getInitials()}
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-800 text-sm">{getAuthorName()}</p>
          <p className="text-xs text-gray-500">{getRelativeTime()}</p>
        </div>

        {/* Actions for own comments */}
        {comment.is_own_comment && !isEditing && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[120px]">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setIsEditing(true)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      handleDelete()
                    }}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content or Edit form */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-sm resize-none"
            rows={3}
            maxLength={2000}
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !editContent.trim()}
              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
      )}
    </div>
  )
}
