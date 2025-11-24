import { PageTracking } from '@/app/components/PageTracking'
import { TrackedButton } from '@/app/components/TrackedButton'
import { OtpConfirmationCard } from './OtpConfirmationCard'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center p-4">
      <PageTracking pageName="Sign Up Success" />
      <div className="w-full max-w-md">
        <OtpConfirmationCard />
        <div className="mt-6">
          <TrackedButton
            href="/auth/login"
            className="block w-full px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] font-black text-white text-center transition-all duration-200"
            eventName="User Clicked Back to Login Button"
            buttonId="sign-up-success-back-to-login-button"
            eventProperties={{
              'Button Section': 'Sign Up Success Page',
              'Button Position': 'Below OTP form',
              'Button Type': 'Navigation Button',
              'Button Text': 'Back to Login →',
              'Button Context': 'Fallback navigation after OTP instructions',
            }}
          >
            Back to Login →
          </TrackedButton>
        </div>
      </div>
    </div>
  )
}

