import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserSubscription } from '@/lib/utils/subscription';
import { BillingStatus } from '@/app/components/billing/BillingStatus';
import { BillingActions } from '@/app/components/billing/BillingActions';
import { SuccessHandler } from '@/app/components/billing/SuccessHandler';
import { AutoSyncSubscription } from '@/app/components/billing/AutoSyncSubscription';
import { PlanSwitcher } from '@/app/components/billing/PlanSwitcher';
import { InvoicesList } from '@/app/components/billing/InvoicesList';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get subscription from database
  const subscription = await getUserSubscription(user.id);
  
  // Debug logging
  if (subscription) {
    console.log('BillingPage - Subscription:', {
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at_period_end_type: typeof subscription.cancel_at_period_end,
      status: subscription.status,
    });
  }

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

        <AutoSyncSubscription subscription={subscription} />
        <SuccessHandler />
        <div className="mb-6">
          <BillingStatus subscription={subscription} />
        </div>
        {subscription && (
          <div className="mb-6">
            <PlanSwitcher subscription={subscription} />
          </div>
        )}
        <div className="mb-6">
          <BillingActions subscription={subscription} />
        </div>
        {subscription && (
          <div className="mb-6">
            <InvoicesList subscription={subscription} />
          </div>
        )}
      </div>
    </div>
  );
}

