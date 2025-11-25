import { createClient } from '@/lib/supabase/server'
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader'
import { FeatureRequestsPageClient } from '@/app/components/feature-requests/FeatureRequestsPageClient'
import { PageTracking } from '@/app/components/PageTracking'

// Helper function to get admin user IDs from environment variable
// Supports comma-separated list: ADMIN_USER_IDS=uuid1,uuid2,uuid3
const getAdminUserIds = (): string[] => {
  const adminIds = process.env.ADMIN_USER_IDS || process.env.ADMIN_USER_ID || ''
  return adminIds.split(',').map(id => id.trim()).filter(Boolean)
}

export default async function FeatureRequestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const hasCompletedProfile = !!(profile?.first_name && profile?.last_name)
  const adminUserIds = getAdminUserIds()
  const isAdmin = adminUserIds.includes(user.id)

  return (
    <>
      <PageTracking pageName="Feature Requests" />
      <MobileDashboardHeader title="Feature Requests" />
      <div className="pt-16 md:pt-0">
        <FeatureRequestsPageClient
          userId={user.id}
          userEmail={user.email || ''}
          hasCompletedProfile={hasCompletedProfile}
          initialProfile={profile || { first_name: '', last_name: '' }}
          isAdmin={isAdmin}
        />
      </div>
    </>
  )
}

