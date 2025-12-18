'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

export const ConditionalLayout = ({
  children,
  navigation,
  footer
}: {
  children: ReactNode
  navigation: ReactNode
  footer: ReactNode
}) => {
  const pathname = usePathname()

  // Check if we're on a dashboard route
  const isDashboard = pathname?.startsWith('/dashboard')

  // Check if we're on an admin route
  const isAdmin = pathname?.startsWith('/admin')

  // Check if we're on an onboarding route
  const isOnboarding = pathname?.startsWith('/onboarding')

  // Check if we're on a public portfolio route (has its own header/footer)
  const isPublicPortfolio = pathname?.startsWith('/p/')

  if (isDashboard || isAdmin || isOnboarding || isPublicPortfolio) {
    // These pages have their own layouts, no nav/footer needed
    return <>{children}</>
  }

  // Other pages get the navigation and footer
  return (
    <>
      {navigation}
      {children}
      {footer}
    </>
  )
}
