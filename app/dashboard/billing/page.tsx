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
import { Sparkles, Rocket, Zap } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <AutoSyncSubscription subscription={subscription} />
          <SuccessHandler />
          
          {/* Exciting Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-3 mb-6">
              <Sparkles className="w-12 h-12 text-purple-600 animate-pulse" />
              <Rocket className="w-12 h-12 text-pink-600 animate-bounce" />
              <Zap className="w-12 h-12 text-orange-600 animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-br from-purple-700 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
              Unlock Your Career Potential
            </h1>
            <p className="text-2xl md:text-3xl text-gray-800 font-bold mb-4">
              Choose the plan that accelerates your product management journey
            </p>
            <p className="text-lg text-gray-700 font-semibold max-w-2xl mx-auto">
              Join thousands of product managers who are leveling up their careers with our comprehensive platform
            </p>
          </div>

          {/* Benefits Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-200">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Unlimited Access</h3>
              <p className="text-gray-700 font-semibold">
                Get unlimited resume optimizations, job tracking, and company research
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-pink-200">
              <div className="text-4xl mb-3">💼</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Career Growth</h3>
              <p className="text-gray-700 font-semibold">
                Access exclusive courses, templates, and resources to advance your career
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-orange-200">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Save Time</h3>
              <p className="text-gray-700 font-semibold">
                Automate your job search with AI-powered tools and insights
              </p>
            </div>
          </div>

          {/* Plans */}
          <PlanComparison />
        </div>
      </div>
    );
  }

  // If subscription exists, show management interface
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

