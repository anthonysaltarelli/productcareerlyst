import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/utils/dashboard-stats'
import { getUserSubscription } from '@/lib/utils/subscription'
import { getUserPlanData } from '@/lib/utils/user-plan'
import { DashboardWelcome } from '@/app/components/DashboardWelcome'
import { DashboardStats } from '@/app/components/DashboardStats'
import { UserPlanProgress } from '@/app/components/UserPlanProgress'
import { OnboardingMilestones } from '@/app/components/OnboardingMilestones'
import { FeatureDiscovery } from '@/app/components/FeatureDiscovery'
import { SubscriptionPromotion } from '@/app/components/SubscriptionPromotion'
import { DashboardNextSteps } from '@/app/components/DashboardNextSteps'
import { AutoSyncSubscription } from '@/app/components/billing/AutoSyncSubscription'
import { DashboardPageTracking } from '@/app/components/DashboardPageTracking'
import { DashboardHomeContent } from '@/app/components/DashboardHomeContent'

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

  // Get user's plan data (from onboarding)
  const planData = await getUserPlanData(user.id)

  // Get user creation date for tracking
  const userCreatedAt = user.created_at

  // Desktop dashboard content
  const desktopContent = (
    <div className="px-4 py-6 md:p-12">
      {/* Page view tracking with comprehensive user state context */}
      <DashboardPageTracking
        stats={stats}
        subscription={subscription ? {
          plan: subscription.plan,
          status: subscription.status,
          isActive: subscription.status === 'active' || subscription.status === 'trialing',
        } : null}
        userCreatedAt={userCreatedAt}
      />
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

      {/* User Plan Progress (from onboarding) */}
      {planData && <UserPlanProgress planData={planData} />}

      {/* Onboarding Milestones */}
      {stats && (
        <OnboardingMilestones
          milestones={stats.milestones}
          stats={stats}
          subscription={subscription ? {
            plan: subscription.plan,
            status: subscription.status,
            isActive: subscription.status === 'active' || subscription.status === 'trialing',
          } : null}
        />
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
        fullStats={stats}
        subscription={subscription ? {
          plan: subscription.plan,
          status: subscription.status,
          isActive: subscription.status === 'active' || subscription.status === 'trialing',
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
          fullStats={stats}
          subscription={subscription ? {
            plan: subscription.plan,
            status: subscription.status,
            isActive: subscription.status === 'active' || subscription.status === 'trialing',
          } : null}
        />
      )}

      {/* Subscription Promotion (only shows if not subscribed) */}
      {stats && (
        <SubscriptionPromotion
          subscription={stats.subscription}
          stats={stats}
        />
      )}
    </div>
  )

  return (
    <DashboardHomeContent 
      desktopContent={desktopContent}
      firstName={profile?.first_name}
    />
  )
}
