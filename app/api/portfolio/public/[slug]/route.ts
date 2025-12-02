import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  Portfolio,
  PortfolioCategoryWithPages,
} from '@/lib/types/portfolio';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export interface PublicPortfolioResponse {
  portfolio: Portfolio;
  categories: PortfolioCategoryWithPages[];
}

/**
 * GET /api/portfolio/public/[slug]
 * Fetch a public portfolio by slug (no authentication required)
 * Only returns published portfolios and published pages
 */
export const GET = async (request: NextRequest, context: RouteContext) => {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();

    // Fetch portfolio by slug (must be published)
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('slug', slug.toLowerCase())
      .eq('is_published', true)
      .maybeSingle();

    if (portfolioError) {
      console.error('Error fetching portfolio:', portfolioError);
      return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Fetch visible categories
    const { data: categories, error: categoriesError } = await supabase
      .from('portfolio_categories')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Fetch published pages only
    const { data: pages, error: pagesError } = await supabase
      .from('portfolio_pages')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .eq('is_published', true)
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

    // Filter out empty categories (no published pages)
    const nonEmptyCategories = categoriesWithPages.filter((c) => c.pages.length > 0);

    const response: PublicPortfolioResponse = {
      portfolio: portfolio as Portfolio,
      categories: nonEmptyCategories,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/portfolio/public/[slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};



