import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ slug: string; pageSlug: string }>;
}

// Generate metadata for SEO
export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug, pageSlug } = await params;
  const supabase = await createClient();

  // Get portfolio
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('id, display_name')
    .eq('slug', slug.toLowerCase())
    .eq('is_published', true)
    .maybeSingle();

  if (!portfolio) {
    return { title: 'Not Found' };
  }

  // Get page
  const { data: page } = await supabase
    .from('portfolio_pages')
    .select('title, description, meta_title, meta_description')
    .eq('portfolio_id', portfolio.id)
    .eq('slug', pageSlug.toLowerCase())
    .eq('is_published', true)
    .maybeSingle();

  if (!page) {
    return { title: 'Not Found' };
  }

  const title = page.meta_title || `${page.title} | ${portfolio.display_name}`;
  const description = page.meta_description || page.description || `View ${page.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
  };
};

export default async function PublicPageDetailPage({ params }: PageProps) {
  const { slug, pageSlug } = await params;
  const supabase = await createClient();

  // Get portfolio
  const { data: portfolio, error: portfolioError } = await supabase
    .from('portfolios')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .eq('is_published', true)
    .maybeSingle();

  if (portfolioError || !portfolio) {
    notFound();
  }

  // Get page
  const { data: page, error: pageError } = await supabase
    .from('portfolio_pages')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .eq('slug', pageSlug.toLowerCase())
    .eq('is_published', true)
    .maybeSingle();

  if (pageError || !page) {
    notFound();
  }

  // Get category name
  let categoryName = null;
  if (page.category_id) {
    const { data: category } = await supabase
      .from('portfolio_categories')
      .select('name')
      .eq('id', page.category_id)
      .maybeSingle();
    categoryName = category?.name;
  }

  const publishedDate = page.published_at
    ? new Date(page.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link
            href={`/p/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {portfolio.display_name}'s Portfolio
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          {/* Breadcrumb */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link href={`/p/${slug}`} className="hover:text-purple-600">
              {portfolio.display_name}
            </Link>
            {categoryName && (
              <>
                <span>/</span>
                <span>{categoryName}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            {page.title}
          </h1>

          {/* Description */}
          {page.description && (
            <p className="mb-6 text-xl text-gray-600">{page.description}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {publishedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {publishedDate}
              </div>
            )}
            {page.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <div className="flex flex-wrap gap-1">
                  {page.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cover Image */}
        {page.cover_image_url && (
          <div className="mx-auto max-w-5xl px-6 pb-12">
            <img
              src={page.cover_image_url}
              alt={page.title}
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="py-12">
        <div className="mx-auto max-w-4xl px-6">
          {/* TipTap Content Placeholder */}
          <div className="prose prose-lg max-w-none">
            {page.content && Object.keys(page.content).length > 0 ? (
              <TipTapContentRenderer content={page.content} />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                <div className="mb-4 text-4xl">📝</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-700">
                  Content Coming Soon
                </h3>
                <p className="text-gray-500">
                  This case study is being written. Check back soon!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Link
              href={`/p/${slug}`}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-600"
            >
              <ArrowLeft className="h-4 w-4" />
              View more from {portfolio.display_name}
            </Link>
            <p className="text-sm text-gray-500">
              Built with{' '}
              <a
                href="https://productcareerlyst.com"
                className="text-purple-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Product Careerlyst
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple TipTap content renderer (placeholder)
// This will be enhanced when TipTap is fully integrated
const TipTapContentRenderer = ({ content }: { content: Record<string, unknown> }) => {
  // For now, just show a placeholder
  // This will render TipTap JSON content when the editor is integrated
  if (!content || !content.content || !Array.isArray(content.content)) {
    return null;
  }

  // Basic rendering for simple content
  return (
    <div className="space-y-4">
      {(content.content as Array<{ type: string; content?: Array<{ text?: string }> }>).map((node, index) => {
        if (node.type === 'paragraph' && node.content) {
          const text = node.content.map((c) => c.text || '').join('');
          if (!text) return null;
          return <p key={index}>{text}</p>;
        }
        if (node.type === 'heading' && node.content) {
          const text = node.content.map((c) => c.text || '').join('');
          if (!text) return null;
          return <h2 key={index} className="text-2xl font-bold">{text}</h2>;
        }
        return null;
      })}
    </div>
  );
};

