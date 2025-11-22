import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNavigation } from '@/app/components/DashboardNavigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex overflow-hidden">
      {/* Left Sidebar Navigation - Fixed and Sticky */}
      <aside className="w-72 h-screen bg-gradient-to-br from-slate-800 to-slate-900 border-r-2 border-slate-700 flex flex-col sticky top-0 flex-shrink-0">
        {/* Logo/Brand */}
        <div className="p-6 border-b-2 border-slate-700 flex-shrink-0">
          <h1 className="text-2xl font-black bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Product Careerlyst
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-1">
            Level up your PM career
          </p>
        </div>

        {/* Navigation Links - Scrollable if needed */}
        <DashboardNavigation />
      </aside>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

