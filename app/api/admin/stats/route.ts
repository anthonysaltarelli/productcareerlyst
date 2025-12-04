import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { checkAdminStatus } from '@/lib/utils/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin status
    const isAdmin = await checkAdminStatus(user.id)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Use service role client for admin operations
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get today's date at midnight UTC
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Get start of week (Monday) at midnight UTC
    const weekStart = new Date(today)
    const dayOfWeek = today.getUTCDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    weekStart.setUTCDate(today.getUTCDate() - daysToMonday)
    weekStart.setUTCHours(0, 0, 0, 0)

    // Use admin API to list users (with pagination)
    let allUsers: any[] = []
    let page = 1
    const perPage = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (listError) {
        console.error('Error fetching users:', listError)
        return NextResponse.json(
          { error: 'Failed to fetch user stats' },
          { status: 500 }
        )
      }

      if (data?.users) {
        allUsers = [...allUsers, ...data.users]
        hasMore = data.users.length === perPage
        page++
      } else {
        hasMore = false
      }
    }

    // Filter users by date and exclude test accounts
    const todayUsers = allUsers.filter((u) => {
      const userCreatedAt = new Date(u.created_at)
      const email = u.email?.toLowerCase() || ''
      return (
        userCreatedAt >= today &&
        !email.includes('anthsalt') &&
        !email.includes('anth.saltarelli')
      )
    })

    const weekUsers = allUsers.filter((u) => {
      const userCreatedAt = new Date(u.created_at)
      const email = u.email?.toLowerCase() || ''
      return (
        userCreatedAt >= weekStart &&
        !email.includes('anthsalt') &&
        !email.includes('anth.saltarelli')
      )
    })

    return NextResponse.json({
      newUsersToday: todayUsers.length,
      newUsersThisWeek: weekUsers.length,
    })
  } catch (error) {
    console.error('Error in admin stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

