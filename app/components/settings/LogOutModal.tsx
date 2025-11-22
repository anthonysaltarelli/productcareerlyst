'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface LogOutModalProps {
  onClose: () => void
  onConfirm: () => Promise<void>
}

export const LogOutModal = ({ onClose, onConfirm }: LogOutModalProps) => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-[0_12px_0_0_rgba(0,0,0,0.2)] border-2 border-gray-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="logout-modal-title"
          className="text-2xl font-black bg-gradient-to-br from-red-600 to-orange-600 bg-clip-text text-transparent mb-4"
        >
          Confirm Log Out
        </h2>
        <p className="text-gray-700 font-semibold mb-8">
          Are you sure you want to log out? You'll need to sign in again to access your account.
        </p>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-[1rem] bg-gray-200 hover:bg-gray-300 font-black text-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            tabIndex={0}
            aria-label="Cancel logout"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-[1rem] bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_4px_0_0_rgba(239,68,68,0.6)] border-2 border-red-600 hover:translate-y-1 hover:shadow-[0_2px_0_0_rgba(239,68,68,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_0_0_rgba(239,68,68,0.6)]"
            tabIndex={0}
            aria-label="Confirm logout"
          >
            {loading ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  )
}

