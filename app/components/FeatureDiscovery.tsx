'use client'

import { useFlags } from 'launchdarkly-react-client-sdk'
import Link from 'next/link'

interface FeatureDiscoveryProps {
  stats: {
    lessonsCompleted: number
    coursesCompleted: number
    highestResumeScore: number | null
    totalJobApplications: number
    resumeVersionsCount: number
    contactsCount: number
    companiesResearchedCount: number
  } | null
}

export const FeatureDiscovery = ({ stats }: FeatureDiscoveryProps) => {

  if (!stats) {
    // Loading state
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-8 rounded-[2.5rem] bg-gradient-to-br from-gray-200 to-gray-300 shadow-[0_12px_0_0_rgba(107,114,128,0.3)] border-2 border-gray-300 animate-pulse"
          >
            <div className="h-16 bg-gray-400 rounded-[1.5rem] mb-6"></div>
            <div className="h-4 bg-gray-400 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-400 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  // Calculate course progress (assuming ~7 courses total based on seed data)
  // In production, this could be fetched from API
  const totalCourses = 7
  const courseProgress = totalCourses > 0 
    ? `${stats.coursesCompleted}/${totalCourses} courses`
    : stats.coursesCompleted > 0 
      ? `${stats.coursesCompleted} completed`
      : 'Not started'

  const resumeStatus = stats.highestResumeScore !== null
    ? `Score: ${stats.highestResumeScore}`
    : stats.resumeVersionsCount > 0
      ? `${stats.resumeVersionsCount} version${stats.resumeVersionsCount !== 1 ? 's' : ''}`
      : 'Not started'

  const jobsStatus = stats.totalJobApplications > 0
    ? `${stats.totalJobApplications} application${stats.totalJobApplications !== 1 ? 's' : ''}`
    : 'No applications yet'

  return (
    <div className="mb-8">
      <h2 className="text-3xl font-black text-gray-800 mb-6">
        🚀 Explore Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Courses */}
        <Link href="/dashboard/courses" className="group">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_12px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300 hover:translate-y-1 hover:shadow-[0_8px_0_0_rgba(99,102,241,0.3)] transition-all duration-200">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-400 to-purple-400 shadow-[0_6px_0_0_rgba(99,102,241,0.4)] border-2 border-indigo-500 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">📚</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">PM Courses</h3>
                <p className="text-gray-700 font-medium">
                  Structured learning paths to master product management skills
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-indigo-600 font-black">Browse courses →</span>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                {courseProgress}
              </span>
            </div>
          </div>
        </Link>

        {/* Resume Builder */}
        <Link href="/dashboard/resume" className="group">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_12px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 hover:translate-y-1 hover:shadow-[0_8px_0_0_rgba(37,99,235,0.3)] transition-all duration-200">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-400 to-cyan-400 shadow-[0_6px_0_0_rgba(37,99,235,0.4)] border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">📄</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Resume Builder</h3>
                <p className="text-gray-700 font-medium">
                  Build, optimize, and analyze your resume with AI-powered insights
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-600 font-black">Edit resume →</span>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                {resumeStatus}
              </span>
            </div>
          </div>
        </Link>

        {/* Job Applications */}
        <Link href="/dashboard/jobs" className="group">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-teal-200 to-cyan-200 shadow-[0_12px_0_0_rgba(20,184,166,0.3)] border-2 border-teal-300 hover:translate-y-1 hover:shadow-[0_8px_0_0_rgba(20,184,166,0.3)] transition-all duration-200">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-teal-400 to-cyan-400 shadow-[0_6px_0_0_rgba(20,184,166,0.4)] border-2 border-teal-500 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">💼</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Job Applications</h3>
                <p className="text-gray-700 font-medium">
                  Track applications, research companies, and manage your job search
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-teal-600 font-black">View applications →</span>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                {jobsStatus}
              </span>
            </div>
          </div>
        </Link>

        {/* PM Templates */}
        <Link href="/dashboard/templates" className="group">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-pink-200 to-rose-200 shadow-[0_12px_0_0_rgba(236,72,153,0.3)] border-2 border-pink-300 hover:translate-y-1 hover:shadow-[0_8px_0_0_rgba(236,72,153,0.3)] transition-all duration-200">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-pink-400 to-rose-400 shadow-[0_6px_0_0_rgba(236,72,153,0.4)] border-2 border-pink-500 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">⚡</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">PM Templates</h3>
                <p className="text-gray-700 font-medium">
                  PRDs, roadmaps, OKRs—essential templates and resources
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-pink-600 font-black">Explore templates →</span>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                50+ resources
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

