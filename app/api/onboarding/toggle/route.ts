import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { minimized } = body

    if (typeof minimized !== 'boolean') {
      return NextResponse.json(
        { error: 'minimized must be a boolean' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_minimized: minimized })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating onboarding state:', error)
      return NextResponse.json(
        { error: 'Failed to update onboarding state' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, minimized })
  } catch (error) {
    console.error('Error in onboarding toggle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
