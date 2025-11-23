import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserSubscription } from '@/lib/utils/subscription';
import { PlanComparison } from '@/app/components/billing/PlanComparison';
import { PlansPageTracking } from '@/app/components/billing/PlansPageTracking';

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const subscription = await getUserSubscription(user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <PlansPageTracking subscription={subscription} accountCreatedAt={user.created_at} />
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-700 font-semibold text-lg">
            Select the plan that's right for you
          </p>
        </div>

        <PlanComparison />
      </div>
    </div>
  );
}

