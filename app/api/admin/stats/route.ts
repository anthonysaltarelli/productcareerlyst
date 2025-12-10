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

    // Helper function to get EST date string from a UTC date
    const getESTDateString = (utcDate: Date): string => {
      return utcDate.toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    }

    // Helper function to parse EST date string to date components
    const parseESTDate = (dateString: string): { year: number; month: number; day: number } => {
      const [month, day, year] = dateString.split('/').map(Number)
      return { year, month, day }
    }

    // Get today's date in EST (to match the display timezone)
    const now = new Date()
    const estTodayString = getESTDateString(now)
    const todayESTDate = parseESTDate(estTodayString)
    
    // Get start of week (Monday) in EST
    const estDate = new Date(todayESTDate.year, todayESTDate.month - 1, todayESTDate.day)
    const estDayOfWeek = estDate.getDay()
    const daysToMonday = estDayOfWeek === 0 ? 6 : estDayOfWeek - 1
    const weekStartEST = new Date(todayESTDate.year, todayESTDate.month - 1, todayESTDate.day - daysToMonday)
    const estWeekStartString = getESTDateString(weekStartEST)

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

    // Filter users by date, exclude test accounts, and only count verified users (have last_sign_in_at)
    const todayUsers = allUsers.filter((u) => {
      // Must have email
      if (!u.email) {
        return false
      }
      
      const userCreatedAt = new Date(u.created_at)
      const userESTDateString = getESTDateString(userCreatedAt)
      const email = u.email.toLowerCase()
      
      // Must have signed in (verified) - just check it exists, not when
      if (!u.last_sign_in_at) {
        return false
      }
      
      // Check if created today
      const isCreatedToday = userESTDateString === estTodayString
      
      // Check if not a test account
      const isTestAccount = email.includes('anthsalt') || email.includes('anth.saltarelli')
      
      return isCreatedToday && !isTestAccount
    })
    
    // Debug logging - check server logs to see which users are being counted
    console.log(`[Admin Stats] Today (${estTodayString}): Found ${todayUsers.length} verified users created today`)
    if (todayUsers.length > 0) {
      console.log(`[Admin Stats] Users:`, todayUsers.map(u => ({
        email: u.email,
        created: u.created_at,
        createdEST: getESTDateString(new Date(u.created_at)),
        lastSignIn: u.last_sign_in_at
      })))
    }

    const weekUsers = allUsers.filter((u) => {
      const userCreatedAt = new Date(u.created_at)
      const userESTDateString = getESTDateString(userCreatedAt)
      const userESTDate = parseESTDate(userESTDateString)
      const weekStartESTDate = parseESTDate(estWeekStartString)
      const todayESTDate = parseESTDate(estTodayString)
      
      // Must have signed in (verified) - just check it exists, not when
      if (!u.last_sign_in_at) {
        return false
      }
      
      // Check if user was created on or after week start and on or before today (in EST)
      const userDateValue = new Date(userESTDate.year, userESTDate.month - 1, userESTDate.day).getTime()
      const weekStartValue = new Date(weekStartESTDate.year, weekStartESTDate.month - 1, weekStartESTDate.day).getTime()
      const todayValue = new Date(todayESTDate.year, todayESTDate.month - 1, todayESTDate.day).getTime()
      
      const email = u.email?.toLowerCase() || ''
      return (
        userDateValue >= weekStartValue &&
        userDateValue <= todayValue &&
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

