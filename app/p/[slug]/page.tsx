import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PublicPortfolioView from './PublicPortfolioView';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

// Generate metadata for SEO
export const generateMetadata = async ({ params, searchParams }: PageProps): Promise<Metadata> => {
  const { slug } = await params;
  const { preview } = await searchParams;
  const supabase = await createClient();
  const isPreviewMode = preview === 'true';

  // In preview mode, check if user owns the portfolio
  let isOwner = false;
  if (isPreviewMode) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: ownerCheck } = await supabase
        .from('portfolios')
        .select('id')
        .eq('slug', slug.toLowerCase())
        .eq('user_id', user.id)
        .maybeSingle();
      isOwner = !!ownerCheck;
    }
  }

  // Build query based on preview mode and ownership
  let query = supabase
    .from('portfolios')
    .select('display_name, subtitle, bio')
    .eq('slug', slug.toLowerCase());
  
  // Only apply is_published filter if not in preview mode or not owner
  if (!isPreviewMode || !isOwner) {
    query = query.eq('is_published', true);
  }

  const { data: portfolio } = await query.maybeSingle();

  if (!portfolio) {
    return {
      title: 'Portfolio Not Found',
    };
  }

  const titleSuffix = isPreviewMode && isOwner ? ' (Preview)' : '';

  return {
    title: `${portfolio.display_name} | Product Portfolio${titleSuffix}`,
    description: portfolio.subtitle || portfolio.bio || `View ${portfolio.display_name}'s product portfolio`,
    openGraph: {
      title: `${portfolio.display_name} | Product Portfolio`,
      description: portfolio.subtitle || portfolio.bio || `View ${portfolio.display_name}'s product portfolio`,
      type: 'profile',
    },
    // Prevent search engines from indexing preview pages
    ...(isPreviewMode && isOwner ? { robots: { index: false, follow: false } } : {}),
  };
};

export default async function PublicPortfolioPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const supabase = await createClient();
  const isPreviewMode = preview === 'true';

  // Check if user is owner (for preview mode)
  let isOwner = false;
  if (isPreviewMode) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: ownerCheck } = await supabase
        .from('portfolios')
        .select('id')
        .eq('slug', slug.toLowerCase())
        .eq('user_id', user.id)
        .maybeSingle();
      isOwner = !!ownerCheck;
    }
  }

  // Determine if we should show unpublished content
  const showUnpublished = isPreviewMode && isOwner;

  // Fetch portfolio - skip is_published filter in preview mode for owners
  let portfolioQuery = supabase
    .from('portfolios')
    .select('*')
    .eq('slug', slug.toLowerCase());
  
  if (!showUnpublished) {
    portfolioQuery = portfolioQuery.eq('is_published', true);
  }

  const { data: portfolio, error: portfolioError } = await portfolioQuery.maybeSingle();

  if (portfolioError || !portfolio) {
    notFound();
  }

  // Fetch visible categories
  const { data: categories } = await supabase
    .from('portfolio_categories')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  // Fetch pages - in preview mode, show all pages (including unpublished)
  let pagesQuery = supabase
    .from('portfolio_pages')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .order('display_order', { ascending: true });
  
  if (!showUnpublished) {
    pagesQuery = pagesQuery.eq('is_published', true);
  }

  const { data: pages } = await pagesQuery;

  // Organize pages by category
  const categoriesWithPages = (categories || []).map((category) => ({
    ...category,
    pages: (pages || []).filter((page) => page.category_id === category.id),
  })).filter((c) => c.pages.length > 0);

  // Get featured pages
  const featuredPages = (pages || []).filter((p) => p.is_featured);

  return (
    <PublicPortfolioView
      portfolio={portfolio}
      categories={categoriesWithPages}
      featuredPages={featuredPages}
      isPreviewMode={showUnpublished}
    />
  );
}
