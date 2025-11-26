import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { transferBubbleSubscription } from '@/lib/utils/bubble-transfer'

// Helper function to extract first and last name from user metadata
function extractNameFromMetadata(userMetadata: any): { firstName: string | null; lastName: string | null } {
  // Try direct fields first (Google sometimes provides these)
  if (userMetadata?.given_name || userMetadata?.family_name) {
    return {
      firstName: userMetadata.given_name || null,
      lastName: userMetadata.family_name || null,
    }
  }

  // Try full_name or name field
  const fullName = userMetadata?.full_name || userMetadata?.name || ''
  if (fullName) {
    const nameParts = fullName.trim().split(' ')
    if (nameParts.length >= 2) {
      return {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
      }
    } else if (nameParts.length === 1) {
      return {
        firstName: nameParts[0],
        lastName: null,
      }
    }
  }

  return { firstName: null, lastName: null }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Build redirect URL using request.nextUrl for proper URL handling
  const redirectTo = request.nextUrl.clone()

  // Handle OAuth errors (e.g., user denied access)
  if (error) {
    console.error('[OAuth Callback] Error:', error, errorDescription)
    redirectTo.pathname = '/auth/error'
    redirectTo.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(redirectTo)
  }

  if (code) {
    const cookieStore = await cookies()
    
    // Create a Supabase client that properly handles cookies for Route Handlers
    // This is the key fix - we need to track cookies that will be set
    const cookiesToSet: { name: string; value: string; options: any }[] = []
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookies) {
            // Store cookies to be set on the redirect response
            cookies.forEach((cookie) => {
              cookiesToSet.push(cookie)
              // Also try to set on cookieStore for subsequent operations in this request
              try {
                cookieStore.set(cookie.name, cookie.value, cookie.options)
              } catch {
                // Ignore errors - we'll set on the response
              }
            })
          },
        },
      }
    )
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('[OAuth Callback] Exchange error:', exchangeError)
      redirectTo.pathname = '/auth/error'
      redirectTo.searchParams.set('error', exchangeError.message)
      return NextResponse.redirect(redirectTo)
    }

    if (data?.user) {
      const user = data.user
      const isNewUser = user.created_at === user.last_sign_in_at || 
                        new Date(user.created_at).getTime() > Date.now() - 60000 // Within last minute

      // Extract name from user metadata
      const { firstName, lastName } = extractNameFromMetadata(user.user_metadata)

      // Create/update profile for OAuth users with their name
      // Only set name if it doesn't already exist (don't overwrite user edits)
      try {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existingProfile) {
          // No profile exists - create one with the name
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              first_name: firstName,
              last_name: lastName,
            })

          if (insertError) {
            console.error('[OAuth Callback] Error creating profile:', insertError)
          } else {
            console.log(`[OAuth Callback] Profile created for user ${user.id} with name: ${firstName} ${lastName}`)
          }
        } else {
          // Profile exists - only update name fields if they're currently empty
          const shouldUpdateFirstName = !existingProfile.first_name && firstName
          const shouldUpdateLastName = !existingProfile.last_name && lastName

          if (shouldUpdateFirstName || shouldUpdateLastName) {
            const updateData: { first_name?: string; last_name?: string } = {}
            if (shouldUpdateFirstName) updateData.first_name = firstName
            if (shouldUpdateLastName) updateData.last_name = lastName

            const { error: updateError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('user_id', user.id)

            if (updateError) {
              console.error('[OAuth Callback] Error updating profile:', updateError)
            } else {
              console.log(`[OAuth Callback] Profile updated for user ${user.id} with name: ${firstName} ${lastName}`)
            }
          }
        }
      } catch (profileError) {
        // Don't block user if profile creation fails
        console.error('[OAuth Callback] Error with profile:', profileError)
      }

      // Check if this is a Bubble user and transfer subscription (for new users)
      if (isNewUser && user.email) {
        try {
          await transferBubbleSubscription(user.id, user.email);
          console.log(`[OAuth Callback] Bubble transfer check completed for user ${user.id}`)
        } catch (transferError) {
          // Don't block user if transfer fails - they can do it manually
          console.error('[OAuth Callback] Error transferring Bubble subscription:', transferError);
        }
      }

      // Add new OAuth users to ConvertKit (non-blocking, fire and forget)
      if (isNewUser && user.email) {
        // Import dynamically to avoid blocking
        import('@/lib/utils/convertkit').then(({ addSubscriberToFormAndSequence }) => {
          addSubscriberToFormAndSequence(
            7348426, // Form ID
            2100454, // Sequence ID
            user.email!,
            firstName || undefined
          ).then(() => {
            console.log(`[ConvertKit] Successfully added OAuth user ${user.email} to form and sequence`)
          }).catch((convertkitError) => {
            console.error('[ConvertKit] Error adding OAuth subscriber:', convertkitError)
          })
        }).catch(() => {})
      }

      // Check onboarding status for new users or users who haven't completed it
      let finalRedirectPath = next
      try {
        // Import dynamically to ensure we're using the authenticated supabase client
        const { data: onboardingData } = await supabase
          .from('onboarding_progress')
          .select('is_complete')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!onboardingData?.is_complete) {
          finalRedirectPath = '/onboarding'
        }
      } catch (onboardingError) {
        console.error('[OAuth Callback] Error checking onboarding:', onboardingError)
        // Continue to dashboard if onboarding check fails
      }

      // Build the final redirect URL
      redirectTo.pathname = finalRedirectPath
      redirectTo.searchParams.delete('code')
      redirectTo.searchParams.delete('next')

      // Create redirect response and EXPLICITLY set all auth cookies on it
      // This is the critical fix for production - cookies must be on the redirect response
      const response = NextResponse.redirect(redirectTo)
      
      // Copy all cookies that Supabase auth set to the redirect response
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })

      console.log(`[OAuth Callback] Redirecting to ${finalRedirectPath} with ${cookiesToSet.length} cookies`)
      
      return response
    }
  }

  // No code provided - redirect to error
  redirectTo.pathname = '/auth/error'
  redirectTo.searchParams.set('error', 'No authorization code provided')
  return NextResponse.redirect(redirectTo)
}
