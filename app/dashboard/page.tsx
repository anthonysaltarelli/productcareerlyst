import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardHome() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="p-8 md:p-12">
      {/* Welcome Hero */}
      <div className="mb-8">
        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
          <div className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 text-white text-sm font-bold mb-4">
            ✅ YOU'RE IN!
          </div>
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
            Welcome Back,
            <br />
            Future Senior PM 🚀
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Ready to level up? Let's crush it today.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_10px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 text-center">
          <p className="text-4xl font-black text-blue-600 mb-2">0</p>
          <p className="text-sm font-bold text-gray-700">Mock Interviews</p>
        </div>
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

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* AI Interview Coach */}
        <Link href="/dashboard/interview" className="group">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_12px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300 hover:translate-y-1 hover:shadow-[0_8px_0_0_rgba(37,99,235,0.3)] transition-all duration-200">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-400 to-cyan-400 shadow-[0_6px_0_0_rgba(37,99,235,0.4)] border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🤖</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">AI Interview Coach</h3>
                <p className="text-gray-700 font-medium">
                  Practice with AI that interviews you like Google, Meta, and Amazon
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-600 font-black">Start practicing →</span>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                0 completed
              </span>
            </div>
          </div>
        </Link>

        {/* Career Tracker */}
        <Link href="/dashboard/career" className="group">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_12px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 hover:translate-y-1 hover:shadow-[0_8px_0_0_rgba(147,51,234,0.3)] transition-all duration-200">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-purple-400 to-pink-400 shadow-[0_6px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">📊</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Career Progression</h3>
                <p className="text-gray-700 font-medium">
                  Track your skills and roadmap to Senior PM, Principal, and beyond
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-purple-600 font-black">View roadmap →</span>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                Not started
              </span>
            </div>
          </div>
        </Link>

        {/* Impact Portfolio */}
        <Link href="/dashboard/portfolio" className="group">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300 hover:translate-y-1 hover:shadow-[0_8px_0_0_rgba(22,163,74,0.3)] transition-all duration-200">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-green-400 to-emerald-400 shadow-[0_6px_0_0_rgba(22,163,74,0.4)] border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🏆</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Impact Portfolio</h3>
                <p className="text-gray-700 font-medium">
                  Auto-document wins, metrics, and launches for promotion time
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-600 font-black">Add achievement →</span>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                0 wins logged
              </span>
            </div>
          </div>
        </Link>

        {/* Compensation Intel */}
        <Link href="/dashboard/compensation" className="group">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_12px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300 hover:translate-y-1 hover:shadow-[0_8px_0_0_rgba(234,88,12,0.3)] transition-all duration-200">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-orange-400 to-yellow-400 shadow-[0_6px_0_0_rgba(234,88,12,0.4)] border-2 border-orange-500 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">💰</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Compensation Intelligence</h3>
                <p className="text-gray-700 font-medium">
                  Real salary data and negotiation simulator for PM offers
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-orange-600 font-black">Check salaries →</span>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                Unlock data
              </span>
            </div>
          </div>
        </Link>

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
                0% complete
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
                  PRDs, roadmaps, OKRs—generate first drafts in seconds
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-pink-600 font-black">Explore templates →</span>
              <span className="text-sm font-bold text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                50+ templates
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Next Steps */}
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
          <div className="p-6 rounded-[1.5rem] bg-white/10 border-2 border-slate-600">
            <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black flex items-center justify-center mb-4">
              2
            </div>
            <p className="text-white font-bold mb-2">Take a Mock Interview</p>
            <p className="text-gray-400 text-sm font-medium">
              Assess your current skills with AI interview practice
            </p>
          </div>
          <div className="p-6 rounded-[1.5rem] bg-white/10 border-2 border-slate-600">
            <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-green-500 to-emerald-500 text-white font-black flex items-center justify-center mb-4">
              3
            </div>
            <p className="text-white font-bold mb-2">Start a Course</p>
            <p className="text-gray-400 text-sm font-medium">
              Begin with "PM Fundamentals" or "Interview Mastery"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

