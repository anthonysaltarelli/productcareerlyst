'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

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
  const [mounted, setMounted] = useState(false)
  const scrollPositionRef = useRef(0)

  // Ensure we're on the client before using createPortal
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      // Save current scroll position before locking
      scrollPositionRef.current = window.scrollY
      
      document.addEventListener('keydown', handleEscape)
      
      // Lock body scroll - use a more robust method for iOS Safari
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPositionRef.current}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      
      // Restore body scroll
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      
      // Restore scroll position
      if (scrollPositionRef.current > 0) {
        window.scrollTo(0, scrollPositionRef.current)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSignUp = () => {
    window.location.href = '/auth/sign-up'
  }

  const modalContent = (
    <div
      className="z-[9999] bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        // Use explicit positioning for iOS Safari compatibility
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        // Ensure it's above everything
        zIndex: 9999,
      }}
    >
      <div 
        className="relative w-full max-w-md rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 p-8"
        style={{
          // Prevent modal from being affected by parent transforms
          transform: 'translateZ(0)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 hover:bg-white border-2 border-purple-300 flex items-center justify-center transition-all duration-200"
          aria-label="Close modal"
          tabIndex={0}
        >
          <svg 
            className="w-5 h-5 text-purple-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
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

  // Use portal to render modal at document.body level
  // This ensures fixed positioning works correctly on mobile
  return createPortal(modalContent, document.body)
}

