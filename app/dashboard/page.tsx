import { createClient } from '@/lib/supabase/server'
import { DashboardHomeContent } from '@/app/components/DashboardHomeContent'
import { DashboardStats } from '@/app/components/DashboardStats'
import { DashboardNextSteps } from '@/app/components/DashboardNextSteps'

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
      <DashboardStats />

      {/* Feature Cards Grid */}
      <DashboardHomeContent />

      {/* Next Steps */}
      <DashboardNextSteps />
    </div>
  )
}

