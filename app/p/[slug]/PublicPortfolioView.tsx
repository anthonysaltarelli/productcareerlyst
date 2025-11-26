'use client';

import { useState, useCallback, useEffect } from 'react';
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
  ArrowDown,
} from 'lucide-react';
import PreviewBanner from '@/app/components/PreviewBanner';

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
  PortfolioWorkExperience,
} from '@/lib/types/portfolio';

interface PublicPortfolioViewProps {
  portfolio: Portfolio;
  categories: PortfolioCategoryWithPages[];
  featuredPages: PortfolioPage[];
  isPreviewMode?: boolean;
}

// Smooth scroll to target element
const smoothScrollTo = (targetId: string) => {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function PublicPortfolioView({
  portfolio,
  categories,
  featuredPages,
  isPreviewMode = false,
}: PublicPortfolioViewProps) {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isScrolled, setIsScrolled] = useState(false);

  const socialLinks = portfolio.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some((v) => v);

  // Handle scroll to update active section and nav background
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);

      // Determine active section based on scroll position
      const sections = ['hero', 'about', 'featured', ...categories.map(c => `category-${c.id}`)];
      for (const sectionId of sections.reverse()) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    smoothScrollTo(targetId);
  }, []);

  // Build link suffix for preview mode
  const previewSuffix = isPreviewMode ? '?preview=true' : '';

  return (
    <div className="min-h-screen bg-white">
      {/* Preview Banner */}
      {isPreviewMode && (
        <PreviewBanner 
          editUrl="/dashboard/portfolio/editor"
          portfolioIsPublished={portfolio.is_published}
        />
      )}

      {/* Fixed Navigation */}
      <nav 
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-md shadow-sm' 
            : 'bg-transparent'
        }`}
        style={{ top: isPreviewMode ? '48px' : '0' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-8 md:py-5">
          {/* Logo / Name */}
          <a 
            href="#hero"
            onClick={(e) => handleNavClick(e, 'hero')}
            className={`text-lg font-bold transition-colors duration-300 ${
              isScrolled ? 'text-gray-900' : 'text-gray-900'
            }`}
          >
            {portfolio.display_name}
          </a>

          {/* Navigation Links */}
          <div className="flex items-center gap-6 md:gap-8">
            <a
              href="#about"
              onClick={(e) => handleNavClick(e, 'about')}
              className={`text-sm font-medium transition-all duration-300 hover:text-gray-900 ${
                activeSection === 'about' 
                  ? 'text-gray-900' 
                  : isScrolled ? 'text-gray-600' : 'text-gray-700'
              }`}
            >
              About
            </a>
            {categories.map((category) => (
              <a
                key={category.id}
                href={`#category-${category.id}`}
                onClick={(e) => handleNavClick(e, `category-${category.id}`)}
                className={`hidden text-sm font-medium transition-all duration-300 hover:text-gray-900 sm:block ${
                  activeSection === `category-${category.id}` 
                    ? 'text-gray-900' 
                    : isScrolled ? 'text-gray-600' : 'text-gray-700'
                }`}
              >
                {category.name}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Viewport */}
      <section 
        id="hero" 
        className="relative flex min-h-screen items-center justify-center px-6 md:px-8"
        style={{ paddingTop: isPreviewMode ? '48px' : '0' }}
      >
        {/* Draft Badge */}
        {isPreviewMode && !portfolio.is_published && (
          <div className="absolute left-6 top-24 md:left-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Draft
            </span>
          </div>
        )}

        {/* Hero Content */}
        <div className="max-w-5xl px-2">
          <h1 className="text-5xl leading-[1.1] tracking-tight text-gray-900 sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="font-bold">{portfolio.display_name}</span>
            {portfolio.subtitle && (
              <span className="font-normal text-gray-900">
                {' '}is {portfolio.subtitle.charAt(0).toLowerCase()}{portfolio.subtitle.slice(1)}
                {!portfolio.subtitle.endsWith('.') && '.'}
              </span>
            )}
          </h1>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={() => smoothScrollTo('about')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Scroll to about section"
          type="button"
        >
          <ArrowDown className="h-6 w-6" />
        </button>
      </section>

      {/* About Section */}
      <section id="about" className="scroll-mt-20 border-t border-gray-100 bg-gray-50/50 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          <div className="grid gap-12 md:grid-cols-[280px_1fr] md:gap-16 lg:grid-cols-[320px_1fr]">
            {/* Profile Image & Work Experience */}
            <div className="flex flex-col items-center gap-6 md:items-stretch">
              {portfolio.profile_image_url ? (
                <img
                  src={portfolio.profile_image_url}
                  alt={portfolio.display_name}
                  className="aspect-square w-48 rounded-2xl object-cover shadow-lg md:w-full"
                />
              ) : (
                <div className="flex aspect-square w-48 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-5xl font-bold text-white shadow-lg md:w-full">
                  {portfolio.display_name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Compact Work Experience */}
              {portfolio.work_experience && portfolio.work_experience.length > 0 && (
                <div className="w-full space-y-4">
                  {/* Current Position(s) */}
                  {portfolio.work_experience.filter((exp) => exp.is_current).length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Now
                      </p>
                      <div className="space-y-2">
                        {portfolio.work_experience
                          .filter((exp) => exp.is_current)
                          .map((exp, index) => (
                            <div key={`current-${index}`} className="flex items-baseline justify-between gap-3">
                              <span className="text-sm font-medium text-gray-900">{exp.company}</span>
                              <span className="text-xs text-gray-500">{exp.title}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Previous Position(s) */}
                  {portfolio.work_experience.filter((exp) => !exp.is_current).length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Previously
                      </p>
                      <div className="space-y-2">
                        {portfolio.work_experience
                          .filter((exp) => !exp.is_current)
                          .map((exp, index) => (
                            <div key={`prev-${index}`} className="flex items-baseline justify-between gap-3">
                              <span className="text-sm font-medium text-gray-900">{exp.company}</span>
                              <span className="text-xs text-gray-500">{exp.title}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bio & Links */}
            <div>
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
                About
              </h2>
              {portfolio.bio && (
                <p className="mb-8 whitespace-pre-wrap text-lg leading-relaxed text-gray-700 md:text-xl">
                  {portfolio.bio}
                </p>
              )}

              {/* Social Links */}
              {hasSocialLinks && (
                <div className="mb-8 flex flex-wrap gap-3">
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
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg"
                >
                  <FileText className="h-4 w-4" />
                  Download Resume
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      {featuredPages.length > 0 && (
        <section id="featured" className="scroll-mt-20 border-t border-gray-100 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <h2 className="mb-10 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Featured Work
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {featuredPages.map((page) => (
                <FeaturedPageCard 
                  key={page.id} 
                  page={page} 
                  portfolioSlug={portfolio.slug} 
                  isPreviewMode={isPreviewMode}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Sections */}
      {categories.length === 0 ? (
        <section className="border-t border-gray-100 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 text-center md:px-8">
            <p className="text-gray-500">
              {isPreviewMode 
                ? 'No pages yet. Add some pages to see them here!'
                : 'No published work yet. Check back soon!'}
            </p>
          </div>
        </section>
      ) : (
        categories.map((category, index) => (
          <section 
            key={category.id} 
            id={`category-${category.id}`}
            className={`scroll-mt-20 border-t border-gray-100 py-20 md:py-28 ${
              index % 2 === 1 ? 'bg-gray-50/50' : ''
            }`}
          >
            <div className="mx-auto max-w-5xl px-6 md:px-8">
              {/* Category Header */}
              <div className="mb-16 text-center md:mb-20">
                <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 md:text-xl">
                    {category.description}
                  </p>
                )}
              </div>
              {/* Pages Grid - Centered */}
              <div className="flex flex-wrap justify-center gap-8">
                {category.pages.map((page) => (
                  <PageCard 
                    key={page.id} 
                    page={page} 
                    portfolioSlug={portfolio.slug}
                    isPreviewMode={isPreviewMode}
                  />
                ))}
              </div>
            </div>
          </section>
        ))
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-5xl px-6 text-center md:px-8">
          <p className="text-sm text-gray-500">
            Built with{' '}
            <a
              href="https://productcareerlyst.com"
              className="text-gray-700 transition-colors hover:text-gray-900 hover:underline"
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
    className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all duration-300 hover:bg-gray-900 hover:text-white hover:shadow-lg"
    aria-label={label}
  >
    {icon}
  </a>
);

const FeaturedPageCard = ({
  page,
  portfolioSlug,
  isPreviewMode = false,
}: {
  page: PortfolioPage;
  portfolioSlug: string;
  isPreviewMode?: boolean;
}) => {
  const previewSuffix = isPreviewMode ? '?preview=true' : '';
  
  return (
    <Link
      href={`/p/${portfolioSlug}/${page.slug}${previewSuffix}`}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Cover Image */}
      <div className="aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
        {page.cover_image_url ? (
          <img
            src={page.cover_image_url}
            alt={page.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-5xl">
            📄
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
            Featured
          </span>
          {/* Draft badge in preview mode */}
          {isPreviewMode && !page.is_published && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Draft
            </span>
          )}
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors duration-200 ease-out group-hover:text-gray-600">
          {page.title}
        </h3>
        {page.description && (
          <p className="mb-4 line-clamp-2 text-gray-600">{page.description}</p>
        )}
        {page.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {page.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="absolute bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 opacity-0 transition-[opacity,background-color,color] duration-200 ease-out group-hover:bg-gray-900 group-hover:text-white group-hover:opacity-100">
        <ChevronRight className="h-5 w-5" />
      </div>
    </Link>
  );
};

const PageCard = ({
  page,
  portfolioSlug,
  isPreviewMode = false,
}: {
  page: PortfolioPage;
  portfolioSlug: string;
  isPreviewMode?: boolean;
}) => {
  const previewSuffix = isPreviewMode ? '?preview=true' : '';
  
  return (
    <Link
      href={`/p/${portfolioSlug}/${page.slug}${previewSuffix}`}
      className="group w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Cover Image with Title Overlay */}
      <div className="relative aspect-[3/1] w-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        {page.cover_image_url ? (
          <img
            src={page.cover_image_url}
            alt={page.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl font-bold text-white md:text-2xl">
            {page.title}
          </h3>
        </div>
        {/* Draft badge overlay in preview mode */}
        {isPreviewMode && !page.is_published && (
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Draft
            </span>
          </div>
        )}
      </div>

      {/* Description & Tags Below */}
      {(page.description || page.tags.length > 0) && (
        <div className="p-6">
          {page.description && (
            <p className="mb-4 line-clamp-2 text-base text-gray-600">{page.description}</p>
          )}
          {page.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {page.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600"
                >
                  {tag}
                </span>
              ))}
              {page.tags.length > 3 && (
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-500">
                  +{page.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Link>
  );
};
