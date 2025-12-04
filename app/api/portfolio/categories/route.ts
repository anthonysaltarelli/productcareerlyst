import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  PortfolioCategoryCreateInput,
  PortfolioCategoryWithPages,
} from '@/lib/types/portfolio';

/**
 * GET /api/portfolio/categories
 * Fetch all categories for the current user's portfolio
 */
export const GET = async () => {
  try {
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

    // Fetch categories with pages
    const { data: categories, error: categoriesError } = await supabase
      .from('portfolio_categories')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Fetch pages for all categories
    const { data: pages, error: pagesError } = await supabase
      .from('portfolio_pages')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('display_order', { ascending: true });

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }

    // Organize pages by category
    const categoriesWithPages: PortfolioCategoryWithPages[] = (categories || []).map((category) => ({
      ...category,
      pages: (pages || []).filter((page) => page.category_id === category.id),
    }));

    return NextResponse.json({ categories: categoriesWithPages });
  } catch (error) {
    console.error('Error in GET /api/portfolio/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * POST /api/portfolio/categories
 * Create a new category for the current user's portfolio
 */
export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Omit<PortfolioCategoryCreateInput, 'portfolio_id'> = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Get user's portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (portfolioError || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found. Create a portfolio first.' }, { status: 404 });
    }

    // Get the next display order
    const { data: existingCategories } = await supabase
      .from('portfolio_categories')
      .select('display_order')
      .eq('portfolio_id', portfolio.id)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existingCategories && existingCategories.length > 0
      ? existingCategories[0].display_order + 1
      : 0;

    // Create category
    const { data: category, error: createError } = await supabase
      .from('portfolio_categories')
      .insert({
        portfolio_id: portfolio.id,
        name: body.name,
        description: body.description || null,
        display_order: body.display_order ?? nextOrder,
        is_visible: body.is_visible ?? true,
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating category:', createError);
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/portfolio/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * PUT /api/portfolio/categories
 * Batch update category order
 */
export const PUT = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: { categories: { id: string; display_order: number }[] } = await request.json();

    if (!body.categories || !Array.isArray(body.categories)) {
      return NextResponse.json(
        { error: 'categories array is required' },
        { status: 400 }
      );
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

    // Update each category's display order
    const updates = body.categories.map(({ id, display_order }) =>
      supabase
        .from('portfolio_categories')
        .update({ display_order })
        .eq('id', id)
        .eq('portfolio_id', portfolio.id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/portfolio/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};




