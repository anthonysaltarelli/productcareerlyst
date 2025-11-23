'use client'

import { useFlags } from 'launchdarkly-react-client-sdk'
import { CreditCard, Settings } from 'lucide-react'
import { NavLink } from '@/app/components/NavLink'

export const DashboardNavigation = () => {
  const { coach, compensation, impactPortfolio, careerTracker } = useFlags()

  return (
    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
      <NavLink
        href="/dashboard"
        eventName="User Clicked Dashboard Navigation Link"
        linkId="dashboard-nav-home-link"
        eventProperties={{
          'Link Text': 'Dashboard Home',
          'Link Destination': '/dashboard',
          'Link Section': 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
      >
        <span>Dashboard Home</span>
      </NavLink>
      <NavLink
        href="/dashboard/courses"
        eventName="User Clicked Dashboard Navigation Link"
        linkId="dashboard-nav-courses-link"
        eventProperties={{
          'Link Text': 'Courses',
          'Link Destination': '/dashboard/courses',
          'Link Section': 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
      >
        <span>Courses</span>
      </NavLink>
      <NavLink
        href="/dashboard/jobs"
        eventName="User Clicked Dashboard Navigation Link"
        linkId="dashboard-nav-jobs-link"
        eventProperties={{
          'Link Text': 'Job Applications',
          'Link Destination': '/dashboard/jobs',
          'Link Section': 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
      >
        <span>Job Applications</span>
      </NavLink>
      <NavLink
        href="/dashboard/resume"
        eventName="User Clicked Dashboard Navigation Link"
        linkId="dashboard-nav-resume-link"
        eventProperties={{
          'Link Text': 'Resume Builder',
          'Link Destination': '/dashboard/resume',
          'Link Section': 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
      >
        <span>Resume Builder</span>
      </NavLink>
      <NavLink
        href="/dashboard/portfolio"
        eventName="User Clicked Dashboard Navigation Link"
        linkId="dashboard-nav-portfolio-link"
        eventProperties={{
          'Link Text': 'Product Portfolio',
          'Link Destination': '/dashboard/portfolio',
          'Link Section': 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
      >
        <span>Product Portfolio</span>
      </NavLink>
      {coach && (
        <NavLink
          href="/dashboard/interview"
          eventName="User Clicked Dashboard Navigation Link"
          linkId="dashboard-nav-interview-link"
          eventProperties={{
            'Link Text': 'Interview Coach',
            'Link Destination': '/dashboard/interview',
            'Link Section': 'Sidebar Navigation',
            'Link Position': 'Main Navigation',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': true,
            'Feature Flag Name': 'coach',
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
        >
          <span>Interview Coach</span>
        </NavLink>
      )}
      {careerTracker && (
        <NavLink
          href="/dashboard/career"
          eventName="User Clicked Dashboard Navigation Link"
          linkId="dashboard-nav-career-link"
          eventProperties={{
            'Link Text': 'Career Tracker',
            'Link Destination': '/dashboard/career',
            'Link Section': 'Sidebar Navigation',
            'Link Position': 'Main Navigation',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': true,
            'Feature Flag Name': 'careerTracker',
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
        >
          <span>Career Tracker</span>
        </NavLink>
      )}
      {impactPortfolio && (
        <NavLink
          href="/dashboard/portfolio"
          eventName="User Clicked Dashboard Navigation Link"
          linkId="dashboard-nav-impact-portfolio-link"
          eventProperties={{
            'Link Text': 'Impact Portfolio',
            'Link Destination': '/dashboard/portfolio',
            'Link Section': 'Sidebar Navigation',
            'Link Position': 'Main Navigation',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': true,
            'Feature Flag Name': 'impactPortfolio',
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
        >
          <span>Impact Portfolio</span>
        </NavLink>
      )}
      {compensation && (
        <NavLink
          href="/dashboard/compensation"
          eventName="User Clicked Dashboard Navigation Link"
          linkId="dashboard-nav-compensation-link"
          eventProperties={{
            'Link Text': 'Compensation',
            'Link Destination': '/dashboard/compensation',
            'Link Section': 'Sidebar Navigation',
            'Link Position': 'Main Navigation',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': true,
            'Feature Flag Name': 'compensation',
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
        >
          <span>Compensation</span>
        </NavLink>
      )}
      <NavLink
        href="/dashboard/templates"
        eventName="User Clicked Dashboard Navigation Link"
        linkId="dashboard-nav-templates-link"
        eventProperties={{
          'Link Text': 'PM Templates',
          'Link Destination': '/dashboard/templates',
          'Link Section': 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
      >
        <span>PM Templates</span>
      </NavLink>
      
      {/* Billing Section */}
      <div className="pt-4 mt-4 border-t border-slate-700">
        <NavLink
          href="/dashboard/billing"
          eventName="User Clicked Dashboard Navigation Link"
          linkId="dashboard-nav-billing-link"
          eventProperties={{
            'Link Text': 'Billing & Subscription',
            'Link Destination': '/dashboard/billing',
            'Link Section': 'Sidebar Navigation',
            'Link Position': 'Billing Section',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': false,
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
        >
          <CreditCard className="w-5 h-5 flex-shrink-0" />
          <span>Billing & Subscription</span>
        </NavLink>
        <NavLink
          href="/dashboard/settings"
          eventName="User Clicked Dashboard Navigation Link"
          linkId="dashboard-nav-settings-link"
          eventProperties={{
            'Link Text': 'Settings',
            'Link Destination': '/dashboard/settings',
            'Link Section': 'Sidebar Navigation',
            'Link Position': 'Billing Section',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': false,
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span>Settings</span>
        </NavLink>
      </div>
    </nav>
  )
}


