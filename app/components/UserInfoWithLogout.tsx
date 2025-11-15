'use client'

import { useState } from 'react'
import { LogoutButton } from './logout-button'

interface UserInfoWithLogoutProps {
  email: string | undefined
}

export const UserInfoWithLogout = ({ email }: UserInfoWithLogoutProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return (
    <div 
      className="p-4 border-t-2 border-slate-700 flex-shrink-0 relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="cursor-pointer">
        <p className="text-xs text-gray-400 font-medium mb-1">Signed in as:</p>
        <p className="text-sm text-white font-bold truncate">{email}</p>
      </div>
      
      {/* Logout button that floats above on hover */}
      {isHovered && (
        <div 
          className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-[1rem] shadow-[0_8px_16px_0_rgba(0,0,0,0.4)] transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 z-50"
        >
          <LogoutButton />
        </div>
      )}
    </div>
  )
}

