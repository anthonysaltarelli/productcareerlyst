'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const ErrorContent = () => {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'An unexpected error occurred'

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-red-200 to-orange-200 shadow-[0_20px_0_0_rgba(239,68,68,0.3)] border-2 border-red-300">
          <div className="text-center mb-8">
            <span className="text-6xl mb-6 block">⚠️</span>
            <h1 className="text-4xl font-black bg-gradient-to-br from-red-700 to-orange-600 bg-clip-text text-transparent mb-4">
              Oops! Something Went Wrong
            </h1>
            <div className="p-6 rounded-[1.5rem] bg-white/80 border-2 border-red-300 mb-6">
              <p className="text-red-700 font-semibold text-sm">
                {error}
              </p>
            </div>
            <p className="text-gray-700 font-medium text-sm mb-6">
              Don't worry, these things happen. Try again or contact support if the problem persists.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="/auth/login"
                className="block w-full px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] font-black text-white text-center transition-all duration-200"
              >
                Back to Login →
              </a>
              <a
                href="/"
                className="block w-full px-8 py-4 rounded-[1.5rem] bg-white border-2 border-purple-300 hover:bg-purple-50 font-bold text-purple-600 text-center transition-all duration-200"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
            Loading...
          </div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}

