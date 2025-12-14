import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { isOnboardingComplete } from '@/lib/utils/onboarding'
import { transferBubbleSubscription } from '@/lib/utils/bubble-transfer'
import { inngest } from '@/lib/inngest/client'
import { createAndAddSubscriberToForm } from '@/lib/utils/convertkit'

const NEWSLETTER_FORM_ID = 7348426

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const token = searchParams.get('token')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/dashboard'

  // Handle both token_hash (PKCE flow) and token (legacy flow)
  const verificationToken = token_hash || token

  if (verificationToken && type) {
    const supabase = await createClient()

    // Handle both token_hash (PKCE flow) and token (legacy flow)
    // Note: Email templates use token_hash, so token_hash is the primary flow
    let result;
    if (token_hash) {
      result = await supabase.auth.verifyOtp({
        type,
        token_hash: token_hash,
      });
    } else if (token) {
      // Legacy token flow requires email - try to get from URL or skip
      // Since we're using token_hash in email templates, this is a fallback
      const email = searchParams.get('email');
      if (email) {
        result = await supabase.auth.verifyOtp({
          type,
          token: token,
          email: email,
        });
      } else {
        // If no email provided with legacy token, redirect to error
        redirect(`/auth/error?error=${encodeURIComponent('Email is required for token verification. Please use the link from your email.')}`)
        return;
      }
    } else {
      redirect(`/auth/error?error=${encodeURIComponent('No verification token provided. Please check your email and click the confirmation link.')}`)
      return;
    }

    const { data: { user }, error } = result
    if (!error && user?.email) {
      // Check if this is a Bubble user and transfer subscription
      try {
        await transferBubbleSubscription(user.id, user.email);
      } catch (transferError) {
        // Don't block user if transfer fails - they can do it manually
        console.error('Error transferring Bubble subscription:', transferError);
      }

      // Trigger onboarding abandoned email sequence for new signups (not password recovery)
      if (type === 'email') {
        try {
          await inngest.send({
            id: `onboarding-started-${user.id}`, // Idempotency key
            name: 'onboarding/started',
            data: {
              userId: user.id,
              email: user.email,
            },
          });
          console.log('[Email Confirm] Triggered onboarding/started for user:', user.id);
        } catch (inngestError) {
          // Fire and forget - log but don't fail the request
          console.error('[Email Confirm] Failed to trigger onboarding/started:', inngestError);
        }

        // Add user to ConvertKit newsletter form
        try {
          const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || undefined;
          await createAndAddSubscriberToForm(NEWSLETTER_FORM_ID, user.email, firstName);
          console.log('[Email Confirm] Added user to ConvertKit form:', user.id);
        } catch (convertKitError) {
          // Fire and forget - log but don't fail the request
          console.error('[Email Confirm] Failed to add user to ConvertKit:', convertKitError);
        }
      }

      // Create profile for new email users (only on signup confirmation, not password recovery)
      if (type === 'email') {
        try {
          const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null;
          const lastName = user.user_metadata?.last_name || 
            (user.user_metadata?.full_name ? user.user_metadata.full_name.split(' ').slice(1).join(' ') : null) || 
            null;
          
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingProfile) {
            // No profile exists - create one
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                user_id: user.id,
                first_name: firstName,
                last_name: lastName,
              });
            
            if (insertError) {
              console.error('[Email Confirm] Error creating profile:', insertError);
            } else {
              console.log(`[Email Confirm] Profile created for user ${user.id}`);
            }
          }
          // If profile exists, don't update - user may have already set their name
        } catch (profileError) {
          // Don't block user if profile creation fails
          console.error('[Email Confirm] Error creating profile:', profileError);
        }
      }
      
      // Check onboarding status and redirect accordingly
      // Only check onboarding for new signups (type === 'email'), not password recovery
      if (type === 'email') {
        const onboardingComplete = await isOnboardingComplete(user.id);
        if (!onboardingComplete) {
          // Redirect to onboarding if not complete
          redirect('/onboarding');
          return;
        }
      }
      
      // redirect user to specified redirect URL or protected page
      redirect(next)
    } else {
      // For manual OTP entry (legacy token flow), redirect back to OTP page with error
      const email = searchParams.get('email');
      if (token && email) {
        const errorMessage = error?.message || 'The code you entered is incorrect or has expired. Please try again.';
        redirect(`/auth/sign-up-success?email=${encodeURIComponent(email)}&error=${encodeURIComponent(errorMessage)}`);
      } else {
        // For other flows (token_hash), redirect to error page
        redirect(`/auth/error?error=${encodeURIComponent(error?.message || 'Verification failed')}`)
      }
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=${encodeURIComponent('No verification token provided. Please check your email and click the confirmation link.')}`)
}

