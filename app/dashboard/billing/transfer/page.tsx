import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserSubscription } from '@/lib/utils/subscription';
import { BubbleTransferForm } from '@/app/components/billing/BubbleTransferForm';
import { BubbleTransferPageTracking } from '@/app/components/billing/BubbleTransferPageTracking';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';

export default async function TransferPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const subscription = await getUserSubscription(user.id);

  return (
    <>
      <MobileDashboardHeader title="Transfer" />
      <div className="min-h-screen bg-gray-50 px-4 py-6 pt-20 md:p-8 lg:p-12 md:pt-8 lg:pt-12">
        <div className="max-w-2xl mx-auto">
          <BubbleTransferPageTracking subscription={subscription} accountCreatedAt={user.created_at} />

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-4xl font-black text-gray-800 mb-2">
              Transfer from Bubble
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-medium">
              Link your existing Bubble account to retain your subscription
            </p>
          </div>

          <BubbleTransferForm />
        </div>
      </div>
    </>
  );
}

