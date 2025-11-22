'use client'

import { useFlags } from 'launchdarkly-react-client-sdk'
import Link from 'next/link'
import { CreditCard, Settings } from 'lucide-react'

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
      
      {/* Billing Section */}
      <div className="pt-4 mt-4 border-t border-slate-700">
        <NavLink href="/dashboard/billing" label="Billing & Subscription" icon={<CreditCard className="w-5 h-5" />} />
        <NavLink href="/dashboard/settings" label="Settings" icon={<Settings className="w-5 h-5" />} />
      </div>
    </nav>
  )
}

const NavLink = ({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) => {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </Link>
  )
}

