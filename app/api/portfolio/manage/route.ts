import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  Portfolio,
  PortfolioCreateInput,
  PortfolioUpdateInput,
  PortfolioCategoryWithPages,
  PortfolioAPIResponse,
} from '@/lib/types/portfolio';

/**
 * GET /api/portfolio/manage
 * Fetch the current user's portfolio with categories and pages
 */
export const GET = async () => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (portfolioError) {
      console.error('Error fetching portfolio:', portfolioError);
      return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }

    // If no portfolio exists, return null
    if (!portfolio) {
      return NextResponse.json({ portfolio: null, categories: [] });
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

    // Fetch pages for each category
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

    // Add uncategorized pages
    const uncategorizedPages = (pages || []).filter((page) => !page.category_id);
    if (uncategorizedPages.length > 0) {
      categoriesWithPages.push({
        id: 'uncategorized',
        portfolio_id: portfolio.id,
        name: 'Uncategorized',
        description: 'Pages without a category',
        display_order: 9999,
        is_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pages: uncategorizedPages,
      });
    }

    const response: PortfolioAPIResponse = {
      portfolio: portfolio as Portfolio,
      categories: categoriesWithPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/portfolio/manage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * POST /api/portfolio/manage
 * Create a new portfolio for the current user
 */
export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PortfolioCreateInput = await request.json();

    // Validate required fields
    if (!body.slug || !body.display_name) {
      return NextResponse.json(
        { error: 'slug and display_name are required' },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric, hyphens, underscores only)
    const slugRegex = /^[a-z0-9][a-z0-9-_]*[a-z0-9]$|^[a-z0-9]$/;
    if (!slugRegex.test(body.slug.toLowerCase())) {
      return NextResponse.json(
        { error: 'Slug must be alphanumeric with optional hyphens or underscores' },
        { status: 400 }
      );
    }

    // Check if user already has a portfolio
    const { data: existingPortfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingPortfolio) {
      return NextResponse.json(
        { error: 'User already has a portfolio. Use PUT to update.' },
        { status: 409 }
      );
    }

    // Check if slug is available
    const { data: existingSlug } = await supabase
      .from('portfolios')
      .select('id')
      .eq('slug', body.slug.toLowerCase())
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json(
        { error: 'This slug is already taken' },
        { status: 409 }
      );
    }

    // Create portfolio
    const { data: portfolio, error: createError } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        slug: body.slug.toLowerCase(),
        display_name: body.display_name,
        subtitle: body.subtitle || null,
        bio: body.bio || null,
        profile_image_url: body.profile_image_url || null,
        social_links: body.social_links || {},
        is_published: body.is_published ?? false,
        show_resume_download: body.show_resume_download ?? false,
        resume_url: body.resume_url || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating portfolio:', createError);
      return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 });
    }

    // Create default categories
    const defaultCategories = [
      { name: 'Work', display_order: 0 },
      { name: 'Case Studies', display_order: 1 },
      { name: 'Side Projects', display_order: 2 },
    ];

    const { error: categoriesError } = await supabase
      .from('portfolio_categories')
      .insert(
        defaultCategories.map((cat) => ({
          portfolio_id: portfolio.id,
          name: cat.name,
          display_order: cat.display_order,
          is_visible: true,
        }))
      );

    if (categoriesError) {
      console.error('Error creating default categories:', categoriesError);
      // Don't fail the whole request, just log the error
    }

    return NextResponse.json({ portfolio }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/portfolio/manage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * PUT /api/portfolio/manage
 * Update the current user's portfolio
 */
export const PUT = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PortfolioUpdateInput = await request.json();

    // Get user's portfolio
    const { data: existingPortfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, slug')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !existingPortfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // If updating slug, validate and check availability
    if (body.slug && body.slug !== existingPortfolio.slug) {
      const slugRegex = /^[a-z0-9][a-z0-9-_]*[a-z0-9]$|^[a-z0-9]$/;
      if (!slugRegex.test(body.slug.toLowerCase())) {
        return NextResponse.json(
          { error: 'Slug must be alphanumeric with optional hyphens or underscores' },
          { status: 400 }
        );
      }

      const { data: existingSlug } = await supabase
        .from('portfolios')
        .select('id')
        .eq('slug', body.slug.toLowerCase())
        .neq('id', existingPortfolio.id)
        .maybeSingle();

      if (existingSlug) {
        return NextResponse.json(
          { error: 'This slug is already taken' },
          { status: 409 }
        );
      }
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (body.slug !== undefined) updateData.slug = body.slug.toLowerCase();
    if (body.display_name !== undefined) updateData.display_name = body.display_name;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.profile_image_url !== undefined) updateData.profile_image_url = body.profile_image_url;
    if (body.social_links !== undefined) updateData.social_links = body.social_links;
    if (body.is_published !== undefined) updateData.is_published = body.is_published;
    if (body.show_resume_download !== undefined) updateData.show_resume_download = body.show_resume_download;
    if (body.resume_url !== undefined) updateData.resume_url = body.resume_url;

    // Update portfolio
    const { data: portfolio, error: updateError } = await supabase
      .from('portfolios')
      .update(updateData)
      .eq('id', existingPortfolio.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating portfolio:', updateError);
      return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 });
    }

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error('Error in PUT /api/portfolio/manage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * DELETE /api/portfolio/manage
 * Delete the current user's portfolio (and all related data)
 */
export const DELETE = async () => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's portfolio
    const { data: existingPortfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !existingPortfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Delete portfolio (cascade will handle categories and pages)
    const { error: deleteError } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', existingPortfolio.id);

    if (deleteError) {
      console.error('Error deleting portfolio:', deleteError);
      return NextResponse.json({ error: 'Failed to delete portfolio' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/portfolio/manage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

