import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Block /onboarding-test route in production (dev-only route)
  if (request.nextUrl.pathname === '/onboarding-test') {
    if (process.env.NODE_ENV !== 'development') {
      return new NextResponse('Not Found', { status: 404 })
    }
  }

  // Skip middleware for Stripe webhooks - they need raw body access
  // and should not go through session handling
  if (request.nextUrl.pathname === '/api/stripe/webhook') {
    return NextResponse.next()
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

