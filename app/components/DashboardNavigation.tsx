'use client'

import { useFlags } from 'launchdarkly-react-client-sdk'
import { CreditCard, Settings, Home, BookOpen, Briefcase, FileText, FolderKanban, FileSpreadsheet, Lightbulb, Target } from 'lucide-react'
import { NavLink } from '@/app/components/NavLink'

interface DashboardNavigationProps {
  fullScreen?: boolean
  onNavClick?: () => void
}

export const DashboardNavigation = ({ fullScreen = false, onNavClick }: DashboardNavigationProps) => {
  const { compensation, impactPortfolio, careerTracker } = useFlags()

  // Base styles for nav links
  const baseNavLinkClass = fullScreen
    ? 'flex items-center gap-4 px-4 py-4 rounded-[1.5rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-bold text-lg group'
    : 'flex items-center gap-3 px-4 py-3 rounded-[1rem] text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 font-semibold group'

  const iconClass = fullScreen ? 'w-6 h-6 flex-shrink-0' : 'w-5 h-5 flex-shrink-0'

  return (
    <nav className={fullScreen ? 'px-4 py-6 pb-20 space-y-3 flex-1' : 'flex-1 p-4 space-y-2 overflow-y-auto'}>
      <NavLink
        href="/dashboard"
        eventName="User Clicked Dashboard Navigation Link"
        linkId={fullScreen ? 'mobile-nav-home-link' : 'dashboard-nav-home-link'}
        eventProperties={{
          'Link Text': 'Dashboard',
          'Link Destination': '/dashboard',
          'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className={baseNavLinkClass}
        onClick={onNavClick}
      >
        <Home className={iconClass} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink
        href="/dashboard/courses"
        eventName="User Clicked Dashboard Navigation Link"
        linkId={fullScreen ? 'mobile-nav-courses-link' : 'dashboard-nav-courses-link'}
        eventProperties={{
          'Link Text': 'Courses',
          'Link Destination': '/dashboard/courses',
          'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className={baseNavLinkClass}
        onClick={onNavClick}
      >
        <BookOpen className={iconClass} />
        <span>Courses</span>
      </NavLink>
      <NavLink
        href="/dashboard/jobs"
        eventName="User Clicked Dashboard Navigation Link"
        linkId={fullScreen ? 'mobile-nav-jobs-link' : 'dashboard-nav-jobs-link'}
        eventProperties={{
          'Link Text': 'Job Applications',
          'Link Destination': '/dashboard/jobs',
          'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className={baseNavLinkClass}
        onClick={onNavClick}
      >
        <Briefcase className={iconClass} />
        <span>Job Applications</span>
      </NavLink>
      <NavLink
        href="/dashboard/resume"
        eventName="User Clicked Dashboard Navigation Link"
        linkId={fullScreen ? 'mobile-nav-resume-link' : 'dashboard-nav-resume-link'}
        eventProperties={{
          'Link Text': 'Resume Builder',
          'Link Destination': '/dashboard/resume',
          'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className={baseNavLinkClass}
        onClick={onNavClick}
      >
        <FileText className={iconClass} />
        <span>Resume Builder</span>
      </NavLink>
      <NavLink
        href="/dashboard/portfolio"
        eventName="User Clicked Dashboard Navigation Link"
        linkId={fullScreen ? 'mobile-nav-portfolio-link' : 'dashboard-nav-portfolio-link'}
        eventProperties={{
          'Link Text': 'Product Portfolio',
          'Link Destination': '/dashboard/portfolio',
          'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className={baseNavLinkClass}
        onClick={onNavClick}
      >
        <FolderKanban className={iconClass} />
        <span>Product Portfolio</span>
      </NavLink>
      <NavLink
        href="/dashboard/interview"
        eventName="User Clicked Dashboard Navigation Link"
        linkId={fullScreen ? 'mobile-nav-interview-link' : 'dashboard-nav-interview-link'}
        eventProperties={{
          'Link Text': 'Interview Prep',
          'Link Destination': '/dashboard/interview',
          'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className={baseNavLinkClass}
        onClick={onNavClick}
      >
        <Target className={iconClass} />
        <span>Interview Prep</span>
      </NavLink>
      {careerTracker && (
        <NavLink
          href="/dashboard/career"
          eventName="User Clicked Dashboard Navigation Link"
          linkId={fullScreen ? 'mobile-nav-career-link' : 'dashboard-nav-career-link'}
          eventProperties={{
            'Link Text': 'Career Tracker',
            'Link Destination': '/dashboard/career',
            'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
            'Link Position': 'Main Navigation',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': true,
            'Feature Flag Name': 'careerTracker',
          }}
          className={baseNavLinkClass}
          onClick={onNavClick}
        >
          <span>Career Tracker</span>
        </NavLink>
      )}
      {impactPortfolio && (
        <NavLink
          href="/dashboard/portfolio"
          eventName="User Clicked Dashboard Navigation Link"
          linkId={fullScreen ? 'mobile-nav-impact-portfolio-link' : 'dashboard-nav-impact-portfolio-link'}
          eventProperties={{
            'Link Text': 'Impact Portfolio',
            'Link Destination': '/dashboard/portfolio',
            'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
            'Link Position': 'Main Navigation',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': true,
            'Feature Flag Name': 'impactPortfolio',
          }}
          className={baseNavLinkClass}
          onClick={onNavClick}
        >
          <span>Impact Portfolio</span>
        </NavLink>
      )}
      {compensation && (
        <NavLink
          href="/dashboard/compensation"
          eventName="User Clicked Dashboard Navigation Link"
          linkId={fullScreen ? 'mobile-nav-compensation-link' : 'dashboard-nav-compensation-link'}
          eventProperties={{
            'Link Text': 'Compensation',
            'Link Destination': '/dashboard/compensation',
            'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
            'Link Position': 'Main Navigation',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': true,
            'Feature Flag Name': 'compensation',
          }}
          className={baseNavLinkClass}
          onClick={onNavClick}
        >
          <span>Compensation</span>
        </NavLink>
      )}
      <NavLink
        href="/dashboard/templates"
        eventName="User Clicked Dashboard Navigation Link"
        linkId={fullScreen ? 'mobile-nav-templates-link' : 'dashboard-nav-templates-link'}
        eventProperties={{
          'Link Text': 'PM Resources',
          'Link Destination': '/dashboard/templates',
          'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
          'Link Position': 'Main Navigation',
          'Link Type': 'Navigation Link',
          'Feature Flag Required': false,
        }}
        className={baseNavLinkClass}
        onClick={onNavClick}
      >
        <FileSpreadsheet className={iconClass} />
        <span>PM Resources</span>
      </NavLink>
      
      {/* Billing Section */}
      <div className={`${fullScreen ? 'pt-6 mt-6' : 'pt-4 mt-4'} border-t border-slate-700`}>
        <NavLink
          href="/dashboard/feature-requests"
          eventName="User Clicked Dashboard Navigation Link"
          linkId={fullScreen ? 'mobile-nav-feature-requests-link' : 'dashboard-nav-feature-requests-link'}
          eventProperties={{
            'Link Text': 'Product Feedback',
            'Link Destination': '/dashboard/feature-requests',
            'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
            'Link Position': 'Billing Section',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': false,
          }}
          className={baseNavLinkClass}
          onClick={onNavClick}
        >
          <Lightbulb className={iconClass} />
          <span>Product Feedback</span>
        </NavLink>
        <NavLink
          href="/dashboard/billing"
          eventName="User Clicked Dashboard Navigation Link"
          linkId={fullScreen ? 'mobile-nav-billing-link' : 'dashboard-nav-billing-link'}
          eventProperties={{
            'Link Text': 'Billing',
            'Link Destination': '/dashboard/billing',
            'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
            'Link Position': 'Billing Section',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': false,
          }}
          className={baseNavLinkClass}
          onClick={onNavClick}
        >
          <CreditCard className={iconClass} />
          <span>Billing</span>
        </NavLink>
        <NavLink
          href="/dashboard/settings"
          eventName="User Clicked Dashboard Navigation Link"
          linkId={fullScreen ? 'mobile-nav-settings-link' : 'dashboard-nav-settings-link'}
          eventProperties={{
            'Link Text': 'Settings',
            'Link Destination': '/dashboard/settings',
            'Link Section': fullScreen ? 'Mobile Navigation' : 'Sidebar Navigation',
            'Link Position': 'Billing Section',
            'Link Type': 'Navigation Link',
            'Feature Flag Required': false,
          }}
          className={baseNavLinkClass}
          onClick={onNavClick}
        >
          <Settings className={iconClass} />
          <span>Settings</span>
        </NavLink>
      </div>
    </nav>
  )
}
