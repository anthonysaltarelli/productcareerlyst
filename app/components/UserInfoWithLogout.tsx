'use client'

import Link from 'next/link'

interface UserInfoWithLogoutProps {
  email: string | undefined
}

export const UserInfoWithLogout = ({ email }: UserInfoWithLogoutProps) => {
  return (
    <div className="p-4 border-t-2 border-slate-700 flex-shrink-0">
      <div>
        <p className="text-xs text-gray-400 font-medium mb-1">Signed in as:</p>
        <p className="text-sm text-white font-bold truncate">{email}</p>
      </div>
      <Link
        href="/dashboard/settings"
        className="mt-3 block text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
      >
        Go to Settings →
      </Link>
    </div>
  )
}

