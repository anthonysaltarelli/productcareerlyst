import { createClient } from '@/lib/supabase/server'
import { MobileMenu } from './MobileMenu'
import { NavLink } from './NavLink'
import { TrackedLink } from './TrackedLink'
import { TrackedButton } from './TrackedButton'

export const Navigation = async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-[0_8px_0_0_rgba(147,51,234,0.15)] border-b-2 border-purple-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <TrackedLink
            href="/"
            className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-pink-200 to-purple-200 shadow-[0_6px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300"
            eventName="User Clicked Logo Link"
            linkId="navigation-logo-link"
            eventProperties={{
              'Link Section': 'Navigation',
              'Link Position': 'Left side of navigation bar',
              'Link Type': 'Logo Link',
              'Link Text': 'Product Careerlyst',
            }}
          >
            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Product Careerlyst
            </span>
          </TrackedLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <TrackedLink
                  href="/dashboard"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 hover:bg-white/50 transition-all duration-200"
                  eventName="User Clicked Dashboard Link"
                  linkId="navigation-dashboard-link"
                  eventProperties={{
                    'Link Section': 'Navigation',
                    'Link Position': 'Desktop navigation (when logged in)',
                    'Link Type': 'Navigation Link',
                    'Link Text': 'Dashboard',
                  }}
                >
                  Dashboard
                </TrackedLink>
                <div className="flex items-center gap-3 px-4 py-2 rounded-[1.5rem] bg-white/50 border-2 border-purple-200">
                  <span className="text-sm font-medium text-gray-700">
                    {user.email}
                  </span>
                </div>
              </>
            ) : (
              <>
                <TrackedLink
                  href="/courses"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 hover:bg-white/50 transition-all duration-200"
                  eventName="User Clicked Courses Link"
                  linkId="navigation-courses-link"
                  eventProperties={{
                    'Link Section': 'Navigation',
                    'Link Position': 'Desktop navigation',
                    'Link Type': 'Navigation Link',
                    'Link Text': 'Courses',
                  }}
                >
                  Courses
                </TrackedLink>
                <NavLink
                  href="#features"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 hover:bg-white/50 transition-all duration-200"
                  tabIndex={0}
                  ariaLabel="Features"
                  eventName="User Clicked Features Link"
                  linkId="navigation-features-link"
                  eventProperties={{
                    'Link Section': 'Navigation',
                    'Link Position': 'Desktop navigation',
                    'Link Type': 'Anchor Link',
                    'Link Text': 'Features',
                  }}
                >
                  Features
                </NavLink>
                <NavLink
                  href="#testimonials"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 hover:bg-white/50 transition-all duration-200"
                  tabIndex={0}
                  ariaLabel="Testimonials"
                  eventName="User Clicked Testimonials Link"
                  linkId="navigation-testimonials-link"
                  eventProperties={{
                    'Link Section': 'Navigation',
                    'Link Position': 'Desktop navigation',
                    'Link Type': 'Anchor Link',
                    'Link Text': 'Testimonials',
                  }}
                >
                  Testimonials
                </NavLink>
                <TrackedLink
                  href="/auth/login"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 hover:bg-white/50 transition-all duration-200"
                  eventName="User Clicked Sign In Link"
                  linkId="navigation-sign-in-link"
                  eventProperties={{
                    'Link Section': 'Navigation',
                    'Link Position': 'Desktop navigation',
                    'Link Type': 'Navigation Link',
                    'Link Text': 'Sign In',
                  }}
                >
                  Sign In
                </TrackedLink>
                <TrackedButton
                  href="/auth/sign-up"
                  className="px-8 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200"
                  eventName="User Clicked Sign Up Button"
                  buttonId="navigation-get-access-button"
                  eventProperties={{
                    'Button Section': 'Navigation',
                    'Button Position': 'Right side of navigation bar',
                    'Button Type': 'Primary CTA',
                    'Button Text': 'Get Access →',
                    'Button Context': 'Desktop navigation, after Sign In link',
                  }}
                >
                  Get Access →
                </TrackedButton>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <MobileMenu user={user} />
        </div>
      </div>
    </nav>
  )
}
