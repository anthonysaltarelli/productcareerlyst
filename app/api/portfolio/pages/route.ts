import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { PortfolioPageCreateInput } from '@/lib/types/portfolio';

/**
 * GET /api/portfolio/pages
 * Fetch all pages for the current user's portfolio
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

    // Fetch all pages
    const { data: pages, error: pagesError } = await supabase
      .from('portfolio_pages')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('display_order', { ascending: true });

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }

    return NextResponse.json({ pages: pages || [] });
  } catch (error) {
    console.error('Error in GET /api/portfolio/pages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * POST /api/portfolio/pages
 * Create a new page for the current user's portfolio
 */
export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Omit<PortfolioPageCreateInput, 'portfolio_id'> = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
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

    // Generate slug from title if not provided
    const slug = body.slug || generateSlug(body.title);

    // Get the next display order within the category (or globally if no category)
    const orderQuery = supabase
      .from('portfolio_pages')
      .select('display_order')
      .eq('portfolio_id', portfolio.id)
      .order('display_order', { ascending: false })
      .limit(1);

    if (body.category_id) {
      orderQuery.eq('category_id', body.category_id);
    }

    const { data: existingPages } = await orderQuery;

    const nextOrder = existingPages && existingPages.length > 0
      ? existingPages[0].display_order + 1
      : 0;

    // Create page
    const { data: page, error: createError } = await supabase
      .from('portfolio_pages')
      .insert({
        portfolio_id: portfolio.id,
        category_id: body.category_id || null,
        title: body.title,
        slug,
        description: body.description || null,
        cover_image_url: body.cover_image_url || null,
        tags: body.tags || [],
        content: body.content || { type: 'doc', content: [] },
        display_order: body.display_order ?? nextOrder,
        is_published: body.is_published ?? false,
        is_featured: body.is_featured ?? false,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
        // Unsplash attribution fields
        cover_image_source: body.cover_image_source || null,
        unsplash_photo_id: body.unsplash_photo_id || null,
        unsplash_photographer_name: body.unsplash_photographer_name || null,
        unsplash_photographer_username: body.unsplash_photographer_username || null,
        unsplash_download_location: body.unsplash_download_location || null,
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating page:', createError);
      return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
    }

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/portfolio/pages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * PUT /api/portfolio/pages
 * Batch update page order or move pages between categories
 */
export const PUT = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: {
      pages: { id: string; display_order: number; category_id?: string | null }[];
    } = await request.json();

    if (!body.pages || !Array.isArray(body.pages)) {
      return NextResponse.json({ error: 'pages array is required' }, { status: 400 });
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

    // Update each page
    const updates = body.pages.map(({ id, display_order, category_id }) => {
      const updateData: Record<string, unknown> = { display_order };
      if (category_id !== undefined) {
        updateData.category_id = category_id;
      }
      return supabase
        .from('portfolio_pages')
        .update(updateData)
        .eq('id', id)
        .eq('portfolio_id', portfolio.id);
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/portfolio/pages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * Generate a URL-friendly slug from a title
 */
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 100); // Limit length
};

