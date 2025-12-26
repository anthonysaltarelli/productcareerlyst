import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminStatus } from '@/lib/utils/admin'

interface RouteParams {
  params: Promise<{ lessonId: string }>
}

/**
 * GET /api/admin/lessons/[lessonId]
 * Fetch a lesson with its content for editing
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { lessonId } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const isAdmin = await checkAdminStatus(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Fetch the lesson with course info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        video_url,
        prioritization,
        requires_subscription,
        course_id,
        duration_minutes,
        short_description,
        content,
        created_at,
        updated_at,
        courses (
          id,
          title,
          slug,
          description
        )
      `)
      .eq('id', lessonId)
      .single()

    if (lessonError) {
      console.error('Error fetching lesson:', lessonError)
      if (lessonError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 })
    }

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Error in admin lesson GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/lessons/[lessonId]
 * Update lesson content (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { lessonId } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const isAdmin = await checkAdminStatus(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { content } = body

    // Validate content is TipTap JSON format (basic validation)
    if (content !== null && content !== undefined) {
      if (typeof content !== 'object' || content.type !== 'doc') {
        return NextResponse.json(
          { error: 'Invalid content format. Expected TipTap JSON with type: "doc"' },
          { status: 400 }
        )
      }
    }

    // Update the lesson content
    const { data: lesson, error: updateError } = await supabase
      .from('lessons')
      .update({
        content: content || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .select('id, title, content, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating lesson:', updateError)
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      lesson
    })
  } catch (error) {
    console.error('Error in admin lesson PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
