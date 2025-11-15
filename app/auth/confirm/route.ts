import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const token = searchParams.get('token')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/protected'

  // Handle both token_hash (PKCE flow) and token (legacy flow)
  const verificationToken = token_hash || token

  if (verificationToken && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: verificationToken,
    })
    if (!error) {
      // redirect user to specified redirect URL or protected page
      redirect(next)
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${encodeURIComponent(error?.message || 'Verification failed')}`)
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=${encodeURIComponent('No verification token provided. Please check your email and click the confirmation link.')}`)
}

