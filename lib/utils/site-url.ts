/**
 * Get the site URL for the current environment.
 * 
 * In production, this should be set via NEXT_PUBLIC_SITE_URL environment variable.
 * In development, it will use window.location.origin (client-side) or localhost:3000 (server-side).
 * 
 * This is used for Supabase auth redirects and email confirmation links.
 */
export const getSiteUrl = (): string => {
  // Check for explicit environment variable first (for production)
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default to localhost
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }
  
  // Client-side: use environment variable or window.location.origin
  return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
}

