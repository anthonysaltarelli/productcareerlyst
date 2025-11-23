import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/utils/dashboard-stats';
import { getUserSubscription } from '@/lib/utils/subscription';
import { TemplatesPageContent } from './TemplatesPageContent';

export default async function TemplatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch dashboard stats
  const stats = await getDashboardStats(user.id);

  // Get subscription
  const subscription = await getUserSubscription(user.id);

  // Get user creation date for tracking
  const userCreatedAt = user.created_at;

  return (
    <TemplatesPageContent
      stats={stats}
      subscription={subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        isActive: subscription.status === 'active' || subscription.status === 'trialing',
      } : null}
      userCreatedAt={userCreatedAt}
    />
  );
}
