import { Suspense } from 'react'
import { PageTracking } from '@/app/components/PageTracking'
import { TrackedLink } from '@/app/components/TrackedLink'
import { OtpConfirmationCard } from './OtpConfirmationCard'

export default function SignUpSuccessPage() {
  const otpFallback = (
    <div
      role="status"
      aria-live="polite"
      className="w-full rounded-[2.5rem] bg-white/80 border-2 border-purple-200 p-10 text-center shadow-[0_12px_0_0_rgba(147,51,234,0.25)]"
    >
      <p className="text-lg font-semibold text-purple-700">Loading verification form…</p>
      <p className="mt-2 text-sm text-purple-500">Please hold on while we prepare your OTP screen.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center p-4">
      <PageTracking pageName="Sign Up Success" />
      <div className="w-full max-w-md">
        <Suspense fallback={otpFallback}>
          <OtpConfirmationCard />
        </Suspense>
        <div className="mt-6">
          <TrackedLink
            href="/auth/login"
            className="block text-center font-semibold text-purple-700 hover:text-purple-900 underline decoration-purple-400 decoration-2 transition-colors duration-150"
            eventName="User Clicked Back to Login Button"
            linkId="sign-up-success-back-to-login-link"
            ariaLabel="Return to the login page"
            eventProperties={{
              'Link Section': 'Sign Up Success Page',
              'Link Position': 'Below OTP form',
              'Link Type': 'Navigation Link',
              'Link Text': 'Back to Login →',
              'Link Context': 'Fallback navigation after OTP instructions',
              'Page Section': 'Below the fold',
            }}
          >
            Back to Login →
          </TrackedLink>
        </div>
      </div>
    </div>
  )
}

