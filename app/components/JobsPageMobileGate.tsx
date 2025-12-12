'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { DesktopOnlyFallback } from '@/app/components/DesktopOnlyFallback'

interface JobsPageMobileGateProps {
  children: ReactNode
}

export const JobsPageMobileGate = ({ children }: JobsPageMobileGateProps) => {
  const flags = useFlags()
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Check if we're on mobile web
  useEffect(() => {
    setIsClient(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check on mount
    checkMobile()
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Don't render anything until we know if we're on client
  if (!isClient) {
    return <>{children}</>
  }

  // Check feature flag
  const jobsMobileWebEnabled = flags['jobsMobileWeb'] ?? false

  // If mobile web and flag is false, show fallback
  if (isMobile && !jobsMobileWebEnabled) {
    return (
      <DesktopOnlyFallback
        featureName="Job Applications"
        description="The Job Applications page requires a larger screen for the best experience. Please access this feature from a desktop or laptop computer."
        pageTitle="Job Applications"
      />
    )
  }

  // Otherwise, show normal content
  return <>{children}</>
}








