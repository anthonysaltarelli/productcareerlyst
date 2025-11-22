'use client'

import { useEffect } from 'react'

interface SignUpModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

export const SignUpModal = ({ 
  isOpen, 
  onClose, 
  title = "Create a Free Account",
  description = "Sign up to start watching courses and lessons. It's completely free!"
}: SignUpModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSignUp = () => {
    window.location.href = '/auth/sign-up'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-md rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 hover:bg-white border-2 border-purple-300 flex items-center justify-center transition-all duration-200"
          aria-label="Close modal"
          tabIndex={0}
        >
          <span className="text-2xl font-bold text-purple-600">×</span>
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="text-6xl mb-6">🎓</div>
          <h2 id="modal-title" className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4">
            {title}
          </h2>
          <p className="text-gray-700 font-semibold mb-8">
            {description}
          </p>

          {/* Sign Up Button */}
          <a
            href="/auth/sign-up"
            onClick={handleSignUp}
            className="block w-full px-8 py-4 rounded-[2rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_10px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_6px_0_0_rgba(147,51,234,0.6)] text-xl font-black text-white transition-all duration-200 mb-4"
            aria-label="Sign up to get started"
          >
            Sign Up Now →
          </a>

          <p className="text-sm text-gray-600 font-medium">
            Already have an account?{' '}
            <a
              href="/auth/login"
              className="font-bold text-purple-600 hover:text-purple-700 transition-colors underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

