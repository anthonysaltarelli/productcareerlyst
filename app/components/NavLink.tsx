'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  tabIndex?: number
  ariaLabel?: string
  onClick?: () => void
}

export const NavLink = ({ 
  href, 
  children, 
  className, 
  tabIndex, 
  ariaLabel,
  onClick 
}: NavLinkProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
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

