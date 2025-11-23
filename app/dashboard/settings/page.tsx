import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/utils/dashboard-stats'
import { getUserSubscription } from '@/lib/utils/subscription'
import { SettingsPageClient } from '@/app/components/settings/SettingsPageClient'
import { SettingsPageTracking } from '@/app/components/SettingsPageTracking'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch dashboard stats
  const stats = await getDashboardStats(user.id)

  // Get subscription
  const subscription = await getUserSubscription(user.id)

  // Get user creation date for tracking
  const userCreatedAt = user.created_at

  // Get profile data for completion status
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, linkedin, portfolio')
    .eq('user_id', user.id)
    .maybeSingle()

  const profileCompletion = {
    hasFirstName: !!profile?.first_name,
    hasLastName: !!profile?.last_name,
    hasLinkedIn: !!profile?.linkedin,
    hasPortfolio: !!profile?.portfolio,
    fieldsFilledCount: [
      profile?.first_name,
      profile?.last_name,
      profile?.linkedin,
      profile?.portfolio,
    ].filter(Boolean).length,
  }

  // Format subscription for tracking
  const subscriptionForTracking = subscription
    ? {
        plan: subscription.plan,
        status: subscription.status,
        isActive: ['active', 'trialing', 'past_due'].includes(subscription.status),
      }
    : null

  return (
    <>
      <SettingsPageTracking
        stats={stats}
        subscription={subscriptionForTracking}
        userCreatedAt={userCreatedAt}
        initialActiveTab="profile"
        profileCompletion={profileCompletion}
      />
      <SettingsPageClient
        stats={stats}
        subscription={subscriptionForTracking}
        userCreatedAt={userCreatedAt}
        initialActiveTab="profile"
      />
    </>
  )
}

