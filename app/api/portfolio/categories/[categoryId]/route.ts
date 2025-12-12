import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { PortfolioCategoryUpdateInput } from '@/lib/types/portfolio';

interface RouteContext {
  params: Promise<{ categoryId: string }>;
}

/**
 * GET /api/portfolio/categories/[categoryId]
 * Fetch a single category with its pages
 */
export const GET = async (request: NextRequest, context: RouteContext) => {
  try {
    const { categoryId } = await context.params;
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

    // Fetch category
    const { data: category, error: categoryError } = await supabase
      .from('portfolio_categories')
      .select('*')
      .eq('id', categoryId)
      .eq('portfolio_id', portfolio.id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Fetch pages in this category
    const { data: pages, error: pagesError } = await supabase
      .from('portfolio_pages')
      .select('*')
      .eq('category_id', categoryId)
      .order('display_order', { ascending: true });

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }

    return NextResponse.json({
      category: { ...category, pages: pages || [] },
    });
  } catch (error) {
    console.error('Error in GET /api/portfolio/categories/[categoryId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * PUT /api/portfolio/categories/[categoryId]
 * Update a category
 */
export const PUT = async (request: NextRequest, context: RouteContext) => {
  try {
    const { categoryId } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PortfolioCategoryUpdateInput = await request.json();

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
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.is_visible !== undefined) updateData.is_visible = body.is_visible;

    // Update category
    const { data: category, error: updateError } = await supabase
      .from('portfolio_categories')
      .update(updateData)
      .eq('id', categoryId)
      .eq('portfolio_id', portfolio.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 409 }
        );
      }
      console.error('Error updating category:', updateError);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error in PUT /api/portfolio/categories/[categoryId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * DELETE /api/portfolio/categories/[categoryId]
 * Delete a category (pages will have category_id set to null)
 */
export const DELETE = async (request: NextRequest, context: RouteContext) => {
  try {
    const { categoryId } = await context.params;
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

    // Delete category
    const { error: deleteError } = await supabase
      .from('portfolio_categories')
      .delete()
      .eq('id', categoryId)
      .eq('portfolio_id', portfolio.id);

    if (deleteError) {
      console.error('Error deleting category:', deleteError);
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/portfolio/categories/[categoryId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};







