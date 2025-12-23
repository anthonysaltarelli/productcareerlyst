import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserSubscription } from '@/lib/utils/subscription';
import { BillingStatus } from '@/app/components/billing/BillingStatus';
import { BillingActions } from '@/app/components/billing/BillingActions';
import { SuccessHandler } from '@/app/components/billing/SuccessHandler';
import { AutoSyncSubscription } from '@/app/components/billing/AutoSyncSubscription';
import { PlanSwitcher } from '@/app/components/billing/PlanSwitcher';
import { InvoicesList } from '@/app/components/billing/InvoicesList';
import { PlanComparison } from '@/app/components/billing/PlanComparison';
import { BillingPageTracking } from '@/app/components/billing/BillingPageTracking';
import { TrialBillingStatus } from '@/app/components/billing/TrialBillingStatus';
import { TrialUpgradeSection } from '@/app/components/billing/TrialUpgradeSection';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';

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

  // If no subscription, show exciting upgrade page with plans
  if (!subscription) {
    return (
      <>
        <MobileDashboardHeader title="Billing" />
        <div className="min-h-screen bg-gray-50 p-6 pt-20 md:p-8 lg:p-12 md:pt-8 lg:pt-12">
          <div className="max-w-6xl mx-auto">
            <BillingPageTracking subscription={subscription} accountCreatedAt={user.created_at} />
            <AutoSyncSubscription subscription={subscription} />
            <SuccessHandler />

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
              Billing & Subscription
            </h1>
            <p className="text-gray-600 font-medium">
              Choose the plan that accelerates your product management journey
            </p>
          </div>

          {/* Benefits Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-[2rem] p-6 border-2 border-gray-200 shadow-sm">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-xl font-black text-gray-800 mb-2">Unlimited Access</h3>
              <p className="text-gray-600 font-medium">
                Get unlimited resume optimizations, job tracking, and company research
              </p>
            </div>
            <div className="bg-white rounded-[2rem] p-6 border-2 border-gray-200 shadow-sm">
              <div className="text-4xl mb-3">💼</div>
              <h3 className="text-xl font-black text-gray-800 mb-2">Career Growth</h3>
              <p className="text-gray-600 font-medium">
                Access exclusive courses, templates, and resources to advance your career
              </p>
            </div>
            <div className="bg-white rounded-[2rem] p-6 border-2 border-gray-200 shadow-sm">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-xl font-black text-gray-800 mb-2">Product Portfolio</h3>
              <p className="text-gray-600 font-medium">
                Launch a hosted product portfolio to showcase your experience and case studies
              </p>
            </div>
          </div>

          {/* Plans */}
          <PlanComparison />
          </div>
        </div>
      </>
    );
  }

  // If subscription is in trial, show simplified trial interface
  if (subscription && subscription.status === 'trialing') {
    return (
      <>
        <MobileDashboardHeader title="Billing" />
        <div className="min-h-screen bg-gray-50 p-6 pt-20 md:p-8 lg:p-12 md:pt-8 lg:pt-12">
          <div className="max-w-6xl mx-auto">
            <BillingPageTracking subscription={subscription} accountCreatedAt={user.created_at} />
            <AutoSyncSubscription subscription={subscription} />
            <SuccessHandler />

            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
                Billing & Subscription
              </h1>
              <p className="text-gray-600 font-medium">
                Manage your subscription and billing information
              </p>
            </div>

            {/* Trial Status */}
            <div className="mb-6 max-w-4xl mx-auto">
              <TrialBillingStatus subscription={subscription} />
            </div>

            {/* Upgrade to Paid Plan */}
            <div className="mb-6 max-w-4xl mx-auto">
              <TrialUpgradeSection subscription={subscription} />
            </div>

            {/* Plan Comparison Table */}
            <div className="mb-6">
              <PlanComparison hideContinueButtons={true} />
            </div>
          </div>
        </div>
      </>
    );
  }

  // If subscription exists and is not in trial, show management interface
  return (
    <>
      <MobileDashboardHeader title="Billing" />
      <div className="min-h-screen bg-gray-50 p-6 pt-20 md:p-8 lg:p-12 md:pt-8 lg:pt-12">
        <div className="max-w-4xl mx-auto">
          <BillingPageTracking subscription={subscription} accountCreatedAt={user.created_at} />

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 font-medium">
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
    </>
  );
}

