import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { PortfolioPageUpdateInput } from '@/lib/types/portfolio';

interface RouteContext {
  params: Promise<{ pageId: string }>;
}

/**
 * GET /api/portfolio/pages/[pageId]
 * Fetch a single page
 */
export const GET = async (request: NextRequest, context: RouteContext) => {
  try {
    const { pageId } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (portfolioError || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Fetch page
    const { data: page, error: pageError } = await supabase
      .from('portfolio_pages')
      .select('*')
      .eq('id', pageId)
      .eq('portfolio_id', portfolio.id)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error in GET /api/portfolio/pages/[pageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * PUT /api/portfolio/pages/[pageId]
 * Update a page (metadata and/or content)
 */
export const PUT = async (request: NextRequest, context: RouteContext) => {
  try {
    const { pageId } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PortfolioPageUpdateInput = await request.json();

    // Get user's portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (portfolioError || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (body.category_id !== undefined) updateData.category_id = body.category_id;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.cover_image_url !== undefined) updateData.cover_image_url = body.cover_image_url;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.is_published !== undefined) updateData.is_published = body.is_published;
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
    if (body.meta_title !== undefined) updateData.meta_title = body.meta_title;
    if (body.meta_description !== undefined) updateData.meta_description = body.meta_description;

    // Update page
    const { data: page, error: updateError } = await supabase
      .from('portfolio_pages')
      .update(updateData)
      .eq('id', pageId)
      .eq('portfolio_id', portfolio.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 409 }
        );
      }
      console.error('Error updating page:', updateError);
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error in PUT /api/portfolio/pages/[pageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * DELETE /api/portfolio/pages/[pageId]
 * Delete a page
 */
export const DELETE = async (request: NextRequest, context: RouteContext) => {
  try {
    const { pageId } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (portfolioError || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Delete page
    const { error: deleteError } = await supabase
      .from('portfolio_pages')
      .delete()
      .eq('id', pageId)
      .eq('portfolio_id', portfolio.id);

    if (deleteError) {
      console.error('Error deleting page:', deleteError);
      return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/portfolio/pages/[pageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

