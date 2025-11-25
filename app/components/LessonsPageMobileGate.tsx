'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { DesktopOnlyFallback } from '@/app/components/DesktopOnlyFallback'

interface LessonsPageMobileGateProps {
  children: ReactNode
  lessonTitle: string
}

export const LessonsPageMobileGate = ({ children, lessonTitle }: LessonsPageMobileGateProps) => {
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
  const lessonsMobileWebEnabled = flags['lessonsMobileWeb'] ?? false

  // If mobile web and flag is false, show fallback
  if (isMobile && !lessonsMobileWebEnabled) {
    return (
      <DesktopOnlyFallback
        featureName="Lessons"
        description="The Lessons page requires a larger screen for the best experience. Please access this feature from a desktop or laptop computer."
        pageTitle={lessonTitle}
      />
    )
  }

  // Otherwise, show normal content
  return <>{children}</>
}


