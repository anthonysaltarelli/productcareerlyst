import { LoginForm } from '@/app/components/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
          <div className="text-center mb-8">
            <div className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold mb-4">
              🔐 SECURE LOGIN
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
              Welcome Back!
            </h1>
            <p className="text-gray-700 font-semibold">
              Sign in to continue your PM journey
            </p>
          </div>

          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300 shadow-md">
            <p className="text-sm text-gray-800 leading-relaxed">
              <span className="font-semibold">Signed up before November 22, 2025?</span> We launched a new platform!{' '}
              <a 
                href="/auth/sign-up" 
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                Create a new account
              </a>
              {' '}with the same email address. Questions? Reach out to{' '}
              <a 
                href="mailto:team@productcareerlyst.com" 
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                team@productcareerlyst.com
              </a>
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}

