'use client'

import { useState } from 'react'
import { LogOutModal } from './LogOutModal'

export const LogOutSection = () => {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <h2 className="text-3xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-6">
        Log Out
      </h2>
      <p className="text-gray-700 font-semibold mb-8">
        Sign out of your account
      </p>

      <div className="bg-red-50 rounded-[1.5rem] p-8 border-2 border-red-200">
        <p className="text-gray-800 font-semibold mb-6">
          Are you sure you want to log out? You'll need to sign in again to access your account.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_6px_0_0_rgba(239,68,68,0.6)] border-2 border-red-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(239,68,68,0.6)] font-black text-white transition-all duration-200"
          tabIndex={0}
          aria-label="Open logout confirmation modal"
        >
          Log Out
        </button>
      </div>

      {showModal && (
        <LogOutModal
          onClose={() => setShowModal(false)}
          onConfirm={async () => {
            // This is handled inside LogOutModal
          }}
        />
      )}
    </div>
  )
}

