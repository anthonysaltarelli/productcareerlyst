'use client'

import { useFlags } from 'launchdarkly-react-client-sdk'

export const DashboardNextSteps = () => {
  const { coach } = useFlags()

  return (
    <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_20px_0_0_rgba(15,23,42,0.4)] border-2 border-slate-800">
      <h2 className="text-3xl font-black text-white mb-6 text-center">
        🎯 Your Next Steps
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[1.5rem] bg-white/10 border-2 border-slate-600">
          <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black flex items-center justify-center mb-4">
            1
          </div>
          <p className="text-white font-bold mb-2">Complete Your Profile</p>
          <p className="text-gray-400 text-sm font-medium">
            Set your experience level, target role, and career goals
          </p>
        </div>
        {coach && (
          <div className="p-6 rounded-[1.5rem] bg-white/10 border-2 border-slate-600">
            <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black flex items-center justify-center mb-4">
              2
            </div>
            <p className="text-white font-bold mb-2">Take a Mock Interview</p>
            <p className="text-gray-400 text-sm font-medium">
              Assess your current skills with AI interview practice
            </p>
          </div>
        )}
        <div className="p-6 rounded-[1.5rem] bg-white/10 border-2 border-slate-600">
          <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-green-500 to-emerald-500 text-white font-black flex items-center justify-center mb-4">
            {coach ? '3' : '2'}
          </div>
          <p className="text-white font-bold mb-2">Start a Course</p>
          <p className="text-gray-400 text-sm font-medium">
            Begin with "PM Fundamentals" or "Interview Mastery"
          </p>
        </div>
      </div>
    </div>
  )
}

