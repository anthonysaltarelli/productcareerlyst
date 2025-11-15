import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserInfoWithLogout } from '@/app/components/UserInfoWithLogout'

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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavLink href="/dashboard" label="Dashboard Home" />
          <NavLink href="/dashboard/courses" label="Courses" />
          <NavLink href="/dashboard/jobs" label="Job Applications" />
          <NavLink href="/dashboard/resume" label="Resume Builder" />
          <NavLink href="/dashboard/interview" label="Interview Coach" />
          <NavLink href="/dashboard/career" label="Career Tracker" />
          <NavLink href="/dashboard/portfolio" label="Impact Portfolio" />
          <NavLink href="/dashboard/compensation" label="Compensation" />
          <NavLink href="/dashboard/templates" label="PM Templates" />
        </nav>

        {/* User Info & Logout */}
        <UserInfoWithLogout email={user.email} />
      </aside>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

const NavLink = ({ href, label }: { href: string; label: string }) => {
  return (
    <Link
      href={href}
      className="flex items-center px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
    >
      <span>{label}</span>
    </Link>
  )
}

