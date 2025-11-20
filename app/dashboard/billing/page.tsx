import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserSubscription } from '@/lib/utils/subscription';
import { BillingStatus } from '@/app/components/billing/BillingStatus';
import { BillingActions } from '@/app/components/billing/BillingActions';
import { SuccessHandler } from '@/app/components/billing/SuccessHandler';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const subscription = await getUserSubscription(user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
            Billing & Subscription
          </h1>
          <p className="text-gray-700 font-semibold">
            Manage your subscription and billing information
          </p>
        </div>

        <SuccessHandler />
        <BillingStatus subscription={subscription} />
        <BillingActions subscription={subscription} />
      </div>
    </div>
  );
}

