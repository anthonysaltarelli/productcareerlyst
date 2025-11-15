export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-green-200 to-emerald-200 shadow-[0_20px_0_0_rgba(22,163,74,0.3)] border-2 border-green-300">
          <div className="text-center mb-8">
            <span className="text-6xl mb-6 block">✉️</span>
            <h1 className="text-4xl font-black bg-gradient-to-br from-green-700 to-emerald-600 bg-clip-text text-transparent mb-4">
              Check Your Email!
            </h1>
            <p className="text-gray-700 font-semibold text-lg mb-6">
              We've sent you a confirmation link to verify your email address.
            </p>
            <div className="p-6 rounded-[1.5rem] bg-white/80 border-2 border-green-300 mb-6">
              <p className="text-gray-700 font-medium text-sm">
                <span className="font-bold">Next steps:</span>
              </p>
              <ol className="text-left text-gray-700 font-medium text-sm mt-3 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-black">1.</span>
                  <span>Check your inbox (and spam folder)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-black">2.</span>
                  <span>Click the confirmation link</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-black">3.</span>
                  <span>Start leveling up your PM career!</span>
                </li>
              </ol>
            </div>
            <a
              href="/auth/login"
              className="block w-full px-8 py-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] font-black text-white text-center transition-all duration-200"
            >
              Back to Login →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

