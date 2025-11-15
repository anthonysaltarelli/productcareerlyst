'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export const LogoutButton = () => {
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleLogout()
    }
  }

  return (
    <button
      onClick={handleLogout}
      onKeyDown={handleKeyDown}
      disabled={loading}
      className="px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_6px_0_0_rgba(239,68,68,0.6)] border-2 border-red-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(239,68,68,0.6)] font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_0_rgba(239,68,68,0.6)]"
      tabIndex={0}
      aria-label="Logout"
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  )
}

