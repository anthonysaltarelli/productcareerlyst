import { createClient } from '@/lib/supabase/server'
import { MobileMenu } from './MobileMenu'
import { NavLink } from './NavLink'

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
          <a href="/" className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-pink-200 to-purple-200 shadow-[0_6px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Product Careerlyst
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <a
                  href="/dashboard"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 hover:bg-white/50 transition-all duration-200"
                  tabIndex={0}
                  aria-label="Dashboard"
                >
                  Dashboard
                </a>
                <div className="flex items-center gap-3 px-4 py-2 rounded-[1.5rem] bg-white/50 border-2 border-purple-200">
                  <span className="text-sm font-medium text-gray-700">
                    {user.email}
                  </span>
                </div>
              </>
            ) : (
              <>
                <a
                  href="/courses"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 hover:bg-white/50 transition-all duration-200"
                  tabIndex={0}
                  aria-label="Courses"
                >
                  Courses
                </a>
                <NavLink
                  href="#features"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 hover:bg-white/50 transition-all duration-200"
                  tabIndex={0}
                  ariaLabel="Features"
                >
                  Features
                </NavLink>
                <NavLink
                  href="#testimonials"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 hover:bg-white/50 transition-all duration-200"
                  tabIndex={0}
                  ariaLabel="Testimonials"
                >
                  Testimonials
                </NavLink>
                <a
                  href="/auth/login"
                  className="px-6 py-3 rounded-[1.5rem] font-bold text-gray-700 hover:bg-white/50 transition-all duration-200"
                  tabIndex={0}
                  aria-label="Sign In"
                >
                  Sign In
                </a>
                <a
                  href="/auth/sign-up"
                  className="px-8 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] font-black text-white transition-all duration-200"
                  aria-label="Get access"
                >
                  Get Access →
                </a>
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
