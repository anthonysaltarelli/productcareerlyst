import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { JSONContent } from '@tiptap/react';
import { TipTapReadOnlyWrapper } from '@/app/components/TipTapReadOnlyWrapper';
import PreviewBanner from '@/app/components/PreviewBanner';

interface PageProps {
  params: Promise<{ slug: string; pageSlug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

// Generate metadata for SEO
export const generateMetadata = async ({ params, searchParams }: PageProps): Promise<Metadata> => {
  const { slug, pageSlug } = await params;
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

  const showUnpublished = isPreviewMode && isOwner;

  // Get portfolio
  let portfolioQuery = supabase
    .from('portfolios')
    .select('id, display_name')
    .eq('slug', slug.toLowerCase());
  
  if (!showUnpublished) {
    portfolioQuery = portfolioQuery.eq('is_published', true);
  }

  const { data: portfolio } = await portfolioQuery.maybeSingle();

  if (!portfolio) {
    return { title: 'Not Found' };
  }

  // Get page
  let pageQuery = supabase
    .from('portfolio_pages')
    .select('title, description, meta_title, meta_description, cover_image_url')
    .eq('portfolio_id', portfolio.id)
    .eq('slug', pageSlug.toLowerCase());
  
  if (!showUnpublished) {
    pageQuery = pageQuery.eq('is_published', true);
  }

  const { data: page } = await pageQuery.maybeSingle();

  if (!page) {
    return { title: 'Not Found' };
  }

  const titleSuffix = showUnpublished ? ' (Preview)' : '';
  const title = page.meta_title || `${page.title} | ${portfolio.display_name}${titleSuffix}`;
  const description = page.meta_description || page.description || `View ${page.title}`;

  return {
    title,
    description,
    openGraph: {
      title: page.meta_title || `${page.title} | ${portfolio.display_name}`,
      description,
      type: 'article',
      images: page.cover_image_url ? [{ url: page.cover_image_url }] : undefined,
    },
    twitter: {
      card: page.cover_image_url ? 'summary_large_image' : 'summary',
      title: page.meta_title || `${page.title} | ${portfolio.display_name}`,
      description,
      images: page.cover_image_url ? [page.cover_image_url] : undefined,
    },
    // Prevent search engines from indexing preview pages
    ...(showUnpublished ? { robots: { index: false, follow: false } } : {}),
  };
};

export default async function PublicPageDetailPage({ params, searchParams }: PageProps) {
  const { slug, pageSlug } = await params;
  const { preview } = await searchParams;
  const supabase = await createClient();
  const isPreviewMode = preview === 'true';

  // Check if user is owner (for preview mode)
  let isOwner = false;
  let pageId: string | null = null;
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

  const showUnpublished = isPreviewMode && isOwner;

  // Get portfolio
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

  // Get page
  let pageQuery = supabase
    .from('portfolio_pages')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .eq('slug', pageSlug.toLowerCase());
  
  if (!showUnpublished) {
    pageQuery = pageQuery.eq('is_published', true);
  }

  const { data: page, error: pageError } = await pageQuery.maybeSingle();

  if (pageError || !page) {
    notFound();
  }

  // Store pageId for edit link
  pageId = page.id;

  // Check if content exists and is valid
  const hasContent = page.content && 
    typeof page.content === 'object' && 
    page.content.type === 'doc' &&
    Array.isArray(page.content.content) &&
    page.content.content.length > 0;

  // Build the back link - preserve preview mode if active
  const backLink = showUnpublished ? `/p/${slug}?preview=true` : `/p/${slug}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Preview Banner */}
      {showUnpublished && (
        <PreviewBanner 
          editUrl={`/dashboard/portfolio/editor/${pageId}`}
          portfolioIsPublished={portfolio.is_published && page.is_published}
        />
      )}

      {/* Draft Badge for unpublished pages in preview mode */}
      {showUnpublished && !page.is_published && (
        <div className="mx-auto max-w-5xl px-4 py-2 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Draft - Not yet published
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 sm:pb-6 sm:pt-[30px]">
          <Link
            href={backLink}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </nav>

      {/* Cover Image with Title/Description */}
      {page.cover_image_url ? (
        <>
          {/* Mobile Layout - title inside cover, description below */}
          <div className="mx-auto max-w-5xl px-4 sm:hidden">
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-gray-100">
              <img
                src={page.cover_image_url}
                alt={page.title}
                className="h-full w-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {/* Title overlay - bottom left */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h1 className="text-xl font-bold text-white">
                  {page.title}
                </h1>
              </div>
              {/* Tags - top right */}
              {page.tags && page.tags.length > 0 && (
                <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
                  {page.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-white/30 bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Description below cover image */}
            {page.description && (
              <p className="mt-3 text-sm text-gray-600">
                {page.description}
              </p>
            )}
          </div>

          {/* Desktop Layout - title overlaid on image */}
          <div className="mx-auto hidden max-w-5xl px-6 sm:block">
            <div className="relative aspect-[3/1] w-full overflow-hidden rounded-[20px] bg-gray-100">
              <img
                src={page.cover_image_url}
                alt={page.title}
                className="h-full w-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {/* Title and Description overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <h1 className="text-2xl font-bold text-white md:text-3xl">
                  {page.title}
                </h1>
                {page.description && (
                  <p className="mt-2 text-white/80 md:text-lg">
                    {page.description}
                  </p>
                )}
              </div>
              {/* Tags inside cover image - desktop only */}
              {page.tags && page.tags.length > 0 && (
                <div className="absolute bottom-6 right-6 flex flex-wrap justify-end gap-2 md:bottom-8 md:right-8">
                  {page.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-white/30 bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Header without cover image */
        <header className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-12">
          <h1 className="mb-4 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl md:text-3xl">
            {page.title}
          </h1>
          {page.description && (
            <p className="mb-6 text-base text-gray-600 sm:text-lg">
              {page.description}
            </p>
          )}
          {/* Tags - shown inline for no-cover-image layout on desktop */}
          {page.tags && page.tags.length > 0 && (
            <div className="hidden flex-wrap items-center gap-2 text-sm text-gray-500 sm:flex">
              <Tag className="h-4 w-4" />
              <div className="flex flex-wrap gap-1.5">
                {page.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </header>
      )}

      {/* Tags - Mobile only when NO cover image (with cover image, tags are inside the image) */}
      {page.tags && page.tags.length > 0 && !page.cover_image_url && (
        <div className="mx-auto max-w-5xl px-4 pt-4 sm:hidden">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Tag className="h-4 w-4" />
            <div className="flex flex-wrap gap-1.5">
              {page.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {hasContent ? (
            <TipTapReadOnlyWrapper content={page.content as JSONContent} />
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
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Link
              href={backLink}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-purple-600"
            >
              <ArrowLeft className="h-4 w-4" />
              View more from {portfolio.display_name}
            </Link>
            <p className="text-sm text-gray-500">
              Built with{' '}
              <a
                href="https://productcareerlyst.com"
                className="text-purple-600 transition-colors hover:underline"
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
