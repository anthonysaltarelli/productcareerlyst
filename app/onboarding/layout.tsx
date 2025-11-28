import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isOnboardingComplete } from '@/lib/utils/onboarding';
import { BlackFridayBanner } from '@/app/components/BlackFridayBanner';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check if onboarding is already complete
  const complete = await isOnboardingComplete(user.id);
  if (complete) {
    // Redirect to dashboard if onboarding is complete
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
      <BlackFridayBanner />
      {children}
    </div>
  );
}




