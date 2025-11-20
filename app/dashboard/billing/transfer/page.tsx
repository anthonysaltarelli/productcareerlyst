import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BubbleTransferForm } from '@/app/components/billing/BubbleTransferForm';

export default async function TransferPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-purple-700 to-pink-600 bg-clip-text text-transparent mb-2">
            Transfer from Bubble
          </h1>
          <p className="text-gray-700 font-semibold">
            Link your existing Bubble account to retain your subscription
          </p>
        </div>

        <BubbleTransferForm />
      </div>
    </div>
  );
}

