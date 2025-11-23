'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { trackEvent } from '@/lib/amplitude/client'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  tabIndex?: number
  ariaLabel?: string
  onClick?: () => void
  linkId?: string
  eventName?: string
  eventProperties?: Record<string, any>
}

export const NavLink = ({ 
  href, 
  children, 
  className, 
  tabIndex, 
  ariaLabel,
  onClick,
  linkId,
  eventName,
  eventProperties
}: NavLinkProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Fire tracking in the background - don't block navigation
    if (eventName) {
      setTimeout(() => {
        try {
          const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
          const pageName = pageRoute === '/' ? 'Homepage' : pageRoute.split('/').filter(Boolean).join(' - ') || 'Unknown';
          const referrer = typeof window !== 'undefined' ? document.referrer : '';
          // Safely handle invalid referrer URLs
          let referrerDomain: string | null = null;
          if (referrer) {
            try {
              referrerDomain = new URL(referrer).hostname;
            } catch {
              // Invalid referrer URL - ignore silently
              referrerDomain = null;
            }
          }
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const clickX = e.clientX;
          const clickY = e.clientY;
          const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
          const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
          const clickPosition = {
            horizontal: clickX < viewportWidth / 3 ? 'Left' : clickX > (viewportWidth * 2 / 3) ? 'Right' : 'Center',
            vertical: clickY < viewportHeight / 3 ? 'Top' : clickY > (viewportHeight * 2 / 3) ? 'Bottom' : 'Middle',
          };
          
          trackEvent(eventName, {
            ...eventProperties,
            'Page Route': pageRoute,
            'Page Name': pageName,
            'Link URL': href,
            'Link Destination': href,
            'Link ID': linkId || 'Not Specified',
            'Referrer URL': referrer || 'None',
            'Referrer Domain': referrerDomain || 'None',
            'UTM Source': urlParams?.get('utm_source') || null,
            'UTM Medium': urlParams?.get('utm_medium') || null,
            'UTM Campaign': urlParams?.get('utm_campaign') || null,
            'Click Position X': clickX,
            'Click Position Y': clickY,
            'Click Position Horizontal': clickPosition.horizontal,
            'Click Position Vertical': clickPosition.vertical,
            'Viewport Width': viewportWidth,
            'Viewport Height': viewportHeight,
          });
        } catch (error) {
          // Silently fail - analytics should never block navigation
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ NavLink tracking error (non-blocking):', error);
          }
        }
      }, 0);
    }
    
    // Handle navigation immediately - don't wait for tracking
    // If it's an anchor link (starts with #)
    if (href.startsWith('#')) {
      const sectionId = href.substring(1)
      
      // If we're on the homepage, just scroll
      if (pathname === '/') {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        if (onClick) {
          onClick()
        }
      } else {
        // If we're on a different page, navigate to homepage first
        router.push('/')
        
        // Wait for navigation to complete, then scroll
        setTimeout(() => {
          const element = document.getElementById(sectionId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 500)
        
        if (onClick) {
          onClick()
        }
      }
    } else {
      // Regular link, just navigate
      if (onClick) {
        onClick()
      }
      router.push(href)
    }
  }

  // Handle scroll after navigation from different page (when URL has hash)
  useEffect(() => {
    if (pathname === '/' && typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash) {
        const sectionId = hash.substring(1)
        // Wait a bit for the page to render
        setTimeout(() => {
          const element = document.getElementById(sectionId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 300)
      }
    }
  }, [pathname])

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  )
}

