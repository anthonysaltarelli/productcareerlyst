'use client'

import { useFlags } from 'launchdarkly-react-client-sdk'

export const DashboardStats = () => {
  const { coach } = useFlags()

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {coach && (
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_10px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 text-center">
          <p className="text-4xl font-black text-blue-600 mb-2">0</p>
          <p className="text-sm font-bold text-gray-700">Mock Interviews</p>
        </div>
      )}
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 text-center">
        <p className="text-4xl font-black text-purple-600 mb-2">0%</p>
        <p className="text-sm font-bold text-gray-700">Career Progress</p>
      </div>
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_10px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300 text-center">
        <p className="text-4xl font-black text-green-600 mb-2">0</p>
        <p className="text-sm font-bold text-gray-700">Achievements</p>
      </div>
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_10px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300 text-center">
        <p className="text-4xl font-black text-orange-600 mb-2">0</p>
        <p className="text-sm font-bold text-gray-700">Days Active</p>
      </div>
    </div>
  )
}

