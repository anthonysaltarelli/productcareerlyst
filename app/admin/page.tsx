import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { checkAdminStatus } from '@/lib/utils/admin'
import { AdminStats } from '@/app/components/AdminStats'
import { AdminUsersTable } from '@/app/components/AdminUsersTable'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Double-check admin status (middleware also checks, but defense in depth)
  const isAdmin = await checkAdminStatus(user.id)
  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="px-4 py-6 md:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">System administration and analytics</p>
      </div>

      <div className="space-y-8">
        <AdminStats />
        <AdminUsersTable />
      </div>
    </div>
  )
}

