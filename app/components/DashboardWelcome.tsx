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
  const planName = subscription.plan === 'learn'
    ? 'Learn'
    : subscription.plan === 'accelerate'
      ? 'Accelerate'
      : null

  return (
    <div className="mb-6">
      <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
        Welcome back{firstName ? `, ${firstName}` : ''}!
      </h1>
      <p className="text-gray-600 font-medium">
        {subscription.isActive && planName
          ? `You're on the ${planName} plan. Let's crush it today.`
          : 'Accelerate your product management career today.'
        }
      </p>
    </div>
  )
}

