'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import type { FeedbackItem } from '@/lib/types/feedback'

interface EditFeedbackModalProps {
  feedback: FeedbackItem | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (feedbackId: string, data: { title: string; description: string }) => Promise<void>
}

export function EditFeedbackModal({
  feedback,
  isOpen,
  onClose,
  onSubmit,
}: EditFeedbackModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate form when feedback changes
  useEffect(() => {
    if (feedback) {
      setTitle(feedback.title)
      setDescription(feedback.description)
      setError(null)
    }
  }, [feedback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!feedback) return

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    if (!description.trim()) {
      setError('Please enter a description')
      return
    }

    // Check if anything changed
    if (title.trim() === feedback.title && description.trim() === feedback.description) {
      onClose()
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(feedback.id, {
        title: title.trim(),
        description: description.trim(),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!isOpen || !feedback) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 md:p-8 pb-4 flex-shrink-0 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-800">Edit Feedback</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 border-2 border-red-300 rounded-[1rem] font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your feedback"
                className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the bug, enhancement, or idea in detail."
                rows={6}
                className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {description.length}/2000
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 pt-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-[1rem] border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-[1rem] bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-600 font-bold text-white hover:opacity-90 transition-opacity shadow-[0_4px_0_0_rgba(147,51,234,0.4)] hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(147,51,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
