import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/utils/dashboard-stats'
import { getUserSubscription } from '@/lib/utils/subscription'
import { DashboardWelcome } from '@/app/components/DashboardWelcome'
import { DashboardStats } from '@/app/components/DashboardStats'
import { OnboardingMilestones } from '@/app/components/OnboardingMilestones'
import { FeatureDiscovery } from '@/app/components/FeatureDiscovery'
import { SubscriptionPromotion } from '@/app/components/SubscriptionPromotion'
import { DashboardNextSteps } from '@/app/components/DashboardNextSteps'
import { AutoSyncSubscription } from '@/app/components/billing/AutoSyncSubscription'

export default async function DashboardHome() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch user profile for first name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('user_id', user.id)
    .maybeSingle()

  // Fetch dashboard stats
  const stats = await getDashboardStats(user.id)

  // Get subscription for auto-sync component
  const subscription = await getUserSubscription(user.id)

  return (
    <div className="p-8 md:p-12">
      {/* Auto-sync subscription status in background (throttled) */}
      <AutoSyncSubscription subscription={subscription} minSyncIntervalMinutes={5} />
      {/* Welcome Section */}
      <DashboardWelcome
        firstName={profile?.first_name || null}
        subscription={stats?.subscription || { plan: null, status: null, isActive: false }}
      />

      {/* Quick Stats */}
      <DashboardStats
        stats={stats ? {
          lessonsCompleted: stats.lessonsCompleted,
          coursesCompleted: stats.coursesCompleted,
          highestResumeScore: stats.highestResumeScore,
          totalJobApplications: stats.totalJobApplications,
        } : null}
      />

      {/* Onboarding Milestones */}
      {stats && (
        <OnboardingMilestones milestones={stats.milestones} />
      )}

      {/* Feature Discovery */}
      <FeatureDiscovery
        stats={stats ? {
          lessonsCompleted: stats.lessonsCompleted,
          coursesCompleted: stats.coursesCompleted,
          highestResumeScore: stats.highestResumeScore,
          totalJobApplications: stats.totalJobApplications,
          resumeVersionsCount: stats.resumeVersionsCount,
          contactsCount: stats.contactsCount,
          companiesResearchedCount: stats.companiesResearchedCount,
        } : null}
      />

      {/* Next Steps */}
      {stats && (
        <DashboardNextSteps
          milestones={stats.milestones}
          stats={{
            lessonsCompleted: stats.lessonsCompleted,
            coursesCompleted: stats.coursesCompleted,
            highestResumeScore: stats.highestResumeScore,
            totalJobApplications: stats.totalJobApplications,
          }}
        />
      )}

      {/* Subscription Promotion (only shows if not subscribed) */}
      {stats && (
        <SubscriptionPromotion subscription={stats.subscription} />
      )}
    </div>
  )
}

