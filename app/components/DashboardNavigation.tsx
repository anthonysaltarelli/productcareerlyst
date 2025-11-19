'use client'

import { useFlags } from 'launchdarkly-react-client-sdk'
import Link from 'next/link'

export const DashboardNavigation = () => {
  const { coach, compensation, impactPortfolio, careerTracker } = useFlags()

  return (
    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
      <NavLink href="/dashboard" label="Dashboard Home" />
      <NavLink href="/dashboard/courses" label="Courses" />
      <NavLink href="/dashboard/jobs" label="Job Applications" />
      <NavLink href="/dashboard/resume" label="Resume Builder" />
      {coach && <NavLink href="/dashboard/interview" label="Interview Coach" />}
      {careerTracker && <NavLink href="/dashboard/career" label="Career Tracker" />}
      {impactPortfolio && <NavLink href="/dashboard/portfolio" label="Impact Portfolio" />}
      {compensation && <NavLink href="/dashboard/compensation" label="Compensation" />}
      <NavLink href="/dashboard/templates" label="PM Templates" />
    </nav>
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

