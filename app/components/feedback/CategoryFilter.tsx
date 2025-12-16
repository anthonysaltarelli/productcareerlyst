'use client'

import type { FeedbackCategory } from '@/lib/types/feedback'

interface CategoryFilterProps {
  selectedCategory: FeedbackCategory | 'all'
  onCategoryChange: (category: FeedbackCategory | 'all') => void
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const categories: { value: FeedbackCategory | 'all'; label: string; activeClass: string; inactiveClass: string }[] = [
    {
      value: 'all',
      label: 'All',
      activeClass: 'bg-purple-600 text-white',
      inactiveClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
    {
      value: 'bug',
      label: 'Bug',
      activeClass: 'bg-red-600 text-white',
      inactiveClass: 'bg-red-100 text-red-700 hover:bg-red-200',
    },
    {
      value: 'enhancement',
      label: 'Enhancement',
      activeClass: 'bg-blue-600 text-white',
      inactiveClass: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
    {
      value: 'new_idea',
      label: 'New Idea',
      activeClass: 'bg-green-600 text-white',
      inactiveClass: 'bg-green-100 text-green-700 hover:bg-green-200',
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            selectedCategory === category.value
              ? category.activeClass
              : category.inactiveClass
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}
