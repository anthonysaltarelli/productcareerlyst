import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PublicPortfolioView from './PublicPortfolioView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('display_name, subtitle, bio')
    .eq('slug', slug.toLowerCase())
    .eq('is_published', true)
    .maybeSingle();

  if (!portfolio) {
    return {
      title: 'Portfolio Not Found',
    };
  }

  return {
    title: `${portfolio.display_name} | Product Portfolio`,
    description: portfolio.subtitle || portfolio.bio || `View ${portfolio.display_name}'s product portfolio`,
    openGraph: {
      title: `${portfolio.display_name} | Product Portfolio`,
      description: portfolio.subtitle || portfolio.bio || `View ${portfolio.display_name}'s product portfolio`,
      type: 'profile',
    },
  };
};

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch portfolio
  const { data: portfolio, error: portfolioError } = await supabase
    .from('portfolios')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .eq('is_published', true)
    .maybeSingle();

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

  // Fetch published pages only
  const { data: pages } = await supabase
    .from('portfolio_pages')
    .select('id, portfolio_id, category_id, title, slug, description, cover_image_url, tags, display_order, is_published, is_featured, created_at, updated_at, published_at')
    .eq('portfolio_id', portfolio.id)
    .eq('is_published', true)
    .order('display_order', { ascending: true });

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
    />
  );
}

