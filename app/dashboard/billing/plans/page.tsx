import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserSubscription } from '@/lib/utils/subscription';
import { PlanComparison } from '@/app/components/billing/PlanComparison';
import { PlansPageTracking } from '@/app/components/billing/PlansPageTracking';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const subscription = await getUserSubscription(user.id);

  return (
    <>
      <MobileDashboardHeader title="Choose Plan" />
      <div className="min-h-screen bg-gray-50 px-4 py-6 pt-20 md:p-8 lg:p-12 md:pt-8 lg:pt-12">
        <div className="max-w-6xl mx-auto">
          <PlansPageTracking subscription={subscription} accountCreatedAt={user.created_at} />

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-4xl font-black text-gray-800 mb-2">
              Choose Your Plan
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-medium">
              Select the plan that's right for you
            </p>
          </div>

          <PlanComparison />
        </div>
      </div>
    </>
  );
}

