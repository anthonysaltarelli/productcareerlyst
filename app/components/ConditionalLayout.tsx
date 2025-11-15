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

  if (isDashboard) {
    // Dashboard pages have their own layout with sidebar, no nav/footer needed
    return <>{children}</>
  }

  // Non-dashboard pages get the navigation and footer
  return (
    <>
      {navigation}
      {children}
      {footer}
    </>
  )
}
