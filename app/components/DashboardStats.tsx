'use client'

import { useEffect, useState } from 'react'

interface DashboardStatsProps {
  stats: {
    lessonsCompleted: number
    coursesCompleted: number
    highestResumeScore: number | null
    totalJobApplications: number
  } | null
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  if (!stats) {
    // Loading state
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 rounded-[2rem] bg-gradient-to-br from-gray-200 to-gray-300 shadow-[0_10px_0_0_rgba(107,114,128,0.3)] border-2 border-gray-300 text-center animate-pulse"
          >
            <div className="h-12 bg-gray-400 rounded mb-2"></div>
            <div className="h-4 bg-gray-400 rounded w-24 mx-auto"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_10px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300 text-center">
        <p className="text-4xl font-black text-indigo-600 mb-2">{stats.lessonsCompleted}</p>
        <p className="text-sm font-bold text-gray-700">Lessons Completed</p>
      </div>
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_10px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 text-center">
        <p className="text-4xl font-black text-purple-600 mb-2">{stats.coursesCompleted}</p>
        <p className="text-sm font-bold text-gray-700">Courses Completed</p>
      </div>
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_10px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300 text-center">
        <p className="text-4xl font-black text-green-600 mb-2">
          {stats.highestResumeScore !== null ? `${stats.highestResumeScore}` : '—'}
        </p>
        <p className="text-sm font-bold text-gray-700">Resume Score</p>
      </div>
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_10px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300 text-center">
        <p className="text-4xl font-black text-orange-600 mb-2">{stats.totalJobApplications}</p>
        <p className="text-sm font-bold text-gray-700">Job Applications</p>
      </div>
    </div>
  )
}

