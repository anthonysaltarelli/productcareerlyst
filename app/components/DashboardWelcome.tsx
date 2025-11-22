'use client'

interface DashboardWelcomeProps {
  firstName: string | null
  subscription: {
    plan: 'learn' | 'accelerate' | null
    status: string | null
    isActive: boolean
  }
}

export const DashboardWelcome = ({ firstName, subscription }: DashboardWelcomeProps) => {
  const displayName = firstName || 'there'
  const planName = subscription.plan === 'learn' 
    ? 'Learn' 
    : subscription.plan === 'accelerate' 
      ? 'Accelerate' 
      : null

  return (
    <div className="mb-8">
      <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_20px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            {subscription.isActive && planName && (
              <div className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-500 text-white text-sm font-bold mb-4">
                ✅ {planName} Plan Active
              </div>
            )}
            {!subscription.isActive && (
              <div className="inline-block px-6 py-3 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm font-bold mb-4">
                🚀 Get Started
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
              Welcome Back{firstName ? `, ${firstName}` : ''}!
            </h1>
            <p className="text-xl text-gray-700 font-semibold">
              {subscription.isActive 
                ? 'Ready to level up? Let\'s crush it today.'
                : 'Accelerate your product management career today.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

