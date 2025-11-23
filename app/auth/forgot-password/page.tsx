import { ForgotPasswordForm } from '@/app/components/forgot-password-form'
import { PageTracking } from '@/app/components/PageTracking'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center p-4">
      <PageTracking pageName="Forgot Password" />
      <div className="w-full max-w-md">
        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
          <div className="text-center mb-8">
            <div className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm font-bold mb-4">
              🔑 PASSWORD RESET
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
              Reset Password
            </h1>
            <p className="text-gray-700 font-semibold">
              No worries, we'll help you get back in
            </p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}

