'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Linkedin,
  Twitter,
  Github,
  Globe,
  Mail,
  ExternalLink,
  FileText,
  ChevronRight,
  Youtube,
} from 'lucide-react';

// Custom Substack icon (lucide-react doesn't have one)
const SubstackIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
  </svg>
);
import {
  Portfolio,
  PortfolioCategoryWithPages,
  PortfolioPage,
} from '@/lib/types/portfolio';

interface PublicPortfolioViewProps {
  portfolio: Portfolio;
  categories: PortfolioCategoryWithPages[];
  featuredPages: PortfolioPage[];
}

export default function PublicPortfolioView({
  portfolio,
  categories,
  featuredPages,
}: PublicPortfolioViewProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id || null
  );
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const socialLinks = portfolio.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some((v) => v);

  // Check if bio needs truncation (more than 3 lines or more than ~250 chars)
  const bioNeedsTruncation = portfolio.bio 
    ? portfolio.bio.split('\n').length > 3 || portfolio.bio.length > 250
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Hero Section */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
          <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
            {/* Profile Image */}
            {portfolio.profile_image_url ? (
              <img
                src={portfolio.profile_image_url}
                alt={portfolio.display_name}
                className="mb-6 h-28 w-28 rounded-full object-cover shadow-lg ring-4 ring-white md:mb-0 md:mr-8"
              />
            ) : (
              <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-4xl font-bold text-white shadow-lg ring-4 ring-white md:mb-0 md:mr-8">
                {portfolio.display_name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
                {portfolio.display_name}
              </h1>
              {portfolio.subtitle && (
                <p className="mb-4 text-lg text-gray-600">{portfolio.subtitle}</p>
              )}
              {portfolio.bio && (
                <div className="mb-6 max-w-2xl">
                  <p 
                    className={`whitespace-pre-wrap text-gray-600 ${
                      !isBioExpanded && bioNeedsTruncation ? 'line-clamp-3' : ''
                    }`}
                  >
                    {portfolio.bio}
                  </p>
                  {bioNeedsTruncation && (
                    <button
                      onClick={() => setIsBioExpanded(!isBioExpanded)}
                      className="mt-2 text-sm font-medium text-purple-600 transition-colors hover:text-purple-700"
                      type="button"
                      aria-expanded={isBioExpanded}
                    >
                      {isBioExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              )}

              {/* Social Links */}
              {hasSocialLinks && (
                <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                  {socialLinks.linkedin && (
                    <SocialLink href={socialLinks.linkedin} icon={<Linkedin className="h-5 w-5" />} label="LinkedIn" />
                  )}
                  {socialLinks.twitter && (
                    <SocialLink href={socialLinks.twitter} icon={<Twitter className="h-5 w-5" />} label="Twitter" />
                  )}
                  {socialLinks.github && (
                    <SocialLink href={socialLinks.github} icon={<Github className="h-5 w-5" />} label="GitHub" />
                  )}
                  {socialLinks.youtube && (
                    <SocialLink href={socialLinks.youtube} icon={<Youtube className="h-5 w-5" />} label="YouTube" />
                  )}
                  {socialLinks.substack && (
                    <SocialLink href={socialLinks.substack} icon={<SubstackIcon className="h-5 w-5" />} label="Substack" />
                  )}
                  {socialLinks.website && (
                    <SocialLink href={socialLinks.website} icon={<Globe className="h-5 w-5" />} label="Website" />
                  )}
                  {socialLinks.email && (
                    <SocialLink
                      href={`mailto:${socialLinks.email}`}
                      icon={<Mail className="h-5 w-5" />}
                      label="Email"
                    />
                  )}
                </div>
              )}

              {/* Resume Download */}
              {portfolio.show_resume_download && portfolio.resume_url && (
                <a
                  href={portfolio.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  <FileText className="h-4 w-4" />
                  Download Resume
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Featured Section */}
      {featuredPages.length > 0 && (
        <section className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 py-12">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-purple-600">
              Featured Work
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {featuredPages.map((page) => (
                <FeaturedPageCard key={page.id} page={page} portfolioSlug={portfolio.slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories & Pages */}
      <main className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          {categories.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">No published work yet. Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Category Tabs */}
              {categories.length > 1 && (
                <div className="mb-8 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        activeCategory === category.id
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                      type="button"
                    >
                      {category.name}
                      <span className="ml-2 opacity-60">({category.pages.length})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Pages Grid */}
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={activeCategory === category.id || categories.length === 1 ? '' : 'hidden'}
                >
                  {categories.length === 1 && (
                    <h2 className="mb-6 text-2xl font-bold text-gray-900">{category.name}</h2>
                  )}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {category.pages.map((page) => (
                      <PageCard key={page.id} page={page} portfolioSlug={portfolio.slug} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-5xl px-6 text-center">
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
      </footer>
    </div>
  );
}

// ============================================================================
// Sub Components
// ============================================================================

const SocialLink = ({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-purple-100 hover:text-purple-600"
    aria-label={label}
  >
    {icon}
  </a>
);

const FeaturedPageCard = ({
  page,
  portfolioSlug,
}: {
  page: PortfolioPage;
  portfolioSlug: string;
}) => (
  <Link
    href={`/p/${portfolioSlug}/${page.slug}`}
    className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
  >
    {/* Cover Image */}
    <div className="aspect-video w-full bg-gradient-to-br from-purple-100 to-pink-100">
      {page.cover_image_url ? (
        <img
          src={page.cover_image_url}
          alt={page.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-4xl">
          📄
        </div>
      )}
    </div>

    {/* Content */}
    <div className="p-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
          Featured
        </span>
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-purple-600">
        {page.title}
      </h3>
      {page.description && (
        <p className="mb-4 line-clamp-2 text-gray-600">{page.description}</p>
      )}
      {page.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {page.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>

    {/* Arrow */}
    <div className="absolute bottom-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 opacity-0 transition-opacity group-hover:opacity-100">
      <ChevronRight className="h-4 w-4" />
    </div>
  </Link>
);

const PageCard = ({
  page,
  portfolioSlug,
}: {
  page: PortfolioPage;
  portfolioSlug: string;
}) => (
  <Link
    href={`/p/${portfolioSlug}/${page.slug}`}
    className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-lg"
  >
    {/* Cover Image */}
    <div className="aspect-video w-full bg-gradient-to-br from-gray-50 to-gray-100">
      {page.cover_image_url ? (
        <img
          src={page.cover_image_url}
          alt={page.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl text-gray-300">
          📄
        </div>
      )}
    </div>

    {/* Content */}
    <div className="p-4">
      <h3 className="mb-1 font-semibold text-gray-900 group-hover:text-purple-600">
        {page.title}
      </h3>
      {page.description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-600">{page.description}</p>
      )}
      {page.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {page.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-600"
            >
              {tag}
            </span>
          ))}
          {page.tags.length > 2 && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              +{page.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  </Link>
);

