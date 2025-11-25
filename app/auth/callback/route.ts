import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { isOnboardingComplete } from '@/lib/utils/onboarding'
import { addSubscriberToFormAndSequence } from '@/lib/utils/convertkit'

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
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors (e.g., user denied access)
  if (error) {
    console.error('[OAuth Callback] Error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('[OAuth Callback] Exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent(exchangeError.message)}`
      )
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

      // Add new OAuth users to ConvertKit
      if (isNewUser && user.email) {
        try {
          await addSubscriberToFormAndSequence(
            7348426, // Form ID
            2100454, // Sequence ID
            user.email,
            firstName || undefined
          )
          console.log(`[ConvertKit] Successfully added OAuth user ${user.email} to form and sequence`)
        } catch (convertkitError) {
          // Don't block user if ConvertKit fails
          console.error('[ConvertKit] Error adding OAuth subscriber:', convertkitError)
        }
      }

      // Check onboarding status for new users or users who haven't completed it
      try {
        const onboardingComplete = await isOnboardingComplete(user.id)
        if (!onboardingComplete) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      } catch (onboardingError) {
        console.error('[OAuth Callback] Error checking onboarding:', onboardingError)
        // Continue to dashboard if onboarding check fails
      }

      // Redirect to the intended destination or dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // No code provided - redirect to error
  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent('No authorization code provided')}`
  )
}

