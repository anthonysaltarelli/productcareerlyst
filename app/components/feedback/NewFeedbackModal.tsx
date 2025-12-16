'use client'

import { useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import {
  CATEGORY_CONFIG,
  CATEGORY_OPTIONS,
  FEATURE_OPTIONS,
  type FeedbackCategory,
  type RelatedFeature,
} from '@/lib/types/feedback'

interface NewFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    description: string
    category: FeedbackCategory
    related_feature: RelatedFeature
  }) => Promise<void>
}

export function NewFeedbackModal({ isOpen, onClose, onSubmit }: NewFeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>('new_idea')
  const [relatedFeature, setRelatedFeature] = useState<RelatedFeature>('other')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    if (!description.trim()) {
      setError('Please enter a description')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        related_feature: relatedFeature,
      })
      // Reset form on success
      setCategory('new_idea')
      setRelatedFeature('other')
      setTitle('')
      setDescription('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!isOpen) return null

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
            <h2 className="text-2xl font-black text-gray-800">New Feedback</h2>
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
            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((option) => {
                  const config = CATEGORY_CONFIG[option.value]
                  const isSelected = category === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCategory(option.value)}
                      className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                        isSelected
                          ? `${config.bgColor} ${config.color} border-current shadow-sm`
                          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Related Feature */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Related Feature <span className="text-red-500">*</span>
              </label>
              <select
                value={relatedFeature}
                onChange={(e) => setRelatedFeature(e.target.value as RelatedFeature)}
                className="w-full px-4 py-3 rounded-[1rem] border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-semibold text-gray-800"
              >
                <option value="">Select a feature...</option>
                {FEATURE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

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
                placeholder="Describe the bug, enhancement, or idea in detail. What problem does it solve?"
                rows={4}
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
                  Submitting...
                </span>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
