import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/app/components/logout-button'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <div className="max-w-4xl mx-auto p-8 md:p-12">
        {/* Welcome Card */}
        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300 mb-8">
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 text-white text-sm font-bold mb-4">
              ✅ YOU'RE IN!
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4">
              Welcome to Product Careerlyst
            </h1>
            <p className="text-gray-700 font-semibold text-lg mb-2">
              Signed in as: <span className="font-black text-purple-700">{user.email}</span>
            </p>
            <p className="text-gray-600 font-medium text-sm">
              User ID: {user.id}
            </p>
          </div>

          <div className="flex justify-center">
            <LogoutButton />
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-200 to-cyan-200 shadow-[0_12px_0_0_rgba(37,99,235,0.3)] border-2 border-blue-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-blue-400 to-cyan-400 shadow-[0_6px_0_0_rgba(37,99,235,0.4)] border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  AI Interview Coach
                </h3>
                <p className="text-gray-700 font-medium text-sm">
                  Practice with AI that interviews you like top tech companies
                </p>
              </div>
            </div>
            <button className="w-full px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_6px_0_0_rgba(37,99,235,0.6)] border-2 border-blue-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(37,99,235,0.6)] font-black text-white transition-all duration-200">
              Start Practice →
            </button>
          </div>

          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_12px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-purple-400 to-pink-400 shadow-[0_6px_0_0_rgba(147,51,234,0.4)] border-2 border-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Career Progression
                </h3>
                <p className="text-gray-700 font-medium text-sm">
                  Track your skills and get a roadmap to your next level
                </p>
              </div>
            </div>
            <button className="w-full px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200">
              View Progress →
            </button>
          </div>

          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_12px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-green-400 to-emerald-400 shadow-[0_6px_0_0_rgba(22,163,74,0.4)] border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Impact Portfolio
                </h3>
                <p className="text-gray-700 font-medium text-sm">
                  Document your wins and build your promotion case
                </p>
              </div>
            </div>
            <button className="w-full px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_6px_0_0_rgba(22,163,74,0.6)] border-2 border-green-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(22,163,74,0.6)] font-black text-white transition-all duration-200">
              Add Achievement →
            </button>
          </div>

          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-orange-200 to-yellow-200 shadow-[0_12px_0_0_rgba(234,88,12,0.3)] border-2 border-orange-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-orange-400 to-yellow-400 shadow-[0_6px_0_0_rgba(234,88,12,0.4)] border-2 border-orange-500 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Compensation Intel
                </h3>
                <p className="text-gray-700 font-medium text-sm">
                  Know your worth and practice negotiation tactics
                </p>
              </div>
            </div>
            <button className="w-full px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-orange-500 to-yellow-500 shadow-[0_6px_0_0_rgba(234,88,12,0.6)] border-2 border-orange-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(234,88,12,0.6)] font-black text-white transition-all duration-200">
              Check Salaries →
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-200 to-purple-200 shadow-[0_20px_0_0_rgba(99,102,241,0.3)] border-2 border-indigo-300">
          <h2 className="text-3xl font-black text-gray-800 mb-6 text-center">
            🚀 Your Next Steps
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-[1.5rem] bg-white/80 border-2 border-indigo-300 flex items-center gap-4">
              <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-black flex items-center justify-center flex-shrink-0">
                1
              </div>
              <p className="text-gray-700 font-semibold">
                Complete your profile to get personalized recommendations
              </p>
            </div>
            <div className="p-4 rounded-[1.5rem] bg-white/80 border-2 border-indigo-300 flex items-center gap-4">
              <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-black flex items-center justify-center flex-shrink-0">
                2
              </div>
              <p className="text-gray-700 font-semibold">
                Take your first AI mock interview to assess your current level
              </p>
            </div>
            <div className="p-4 rounded-[1.5rem] bg-white/80 border-2 border-indigo-300 flex items-center gap-4">
              <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-black flex items-center justify-center flex-shrink-0">
                3
              </div>
              <p className="text-gray-700 font-semibold">
                Join the community to connect with 12,847 other PMs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

