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
  Youtube,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react';
import PreviewBanner from '@/app/components/PreviewBanner';
import { Tilt } from '@/components/ui/tilt';
import { motion } from 'framer-motion';

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
  isPreviewMode = false,
}: PublicPortfolioViewProps) {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showPreviousRoles, setShowPreviousRoles] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);

  const socialLinks = portfolio.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some((v) => v);

  // Handle scroll to update active section and nav background
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);

      // Determine active section based on scroll position
      const sections = ['hero', 'about', ...categories.map(c => `category-${c.id}`)];
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
                {' '}is a {portfolio.subtitle}
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
          <div className="grid gap-12 md:grid-cols-[224px_1fr] md:gap-16 lg:grid-cols-[256px_1fr]">
            {/* Profile Image & Work Experience */}
            <div className="flex flex-col items-start gap-6 md:items-stretch">
              {/* Mobile: "About" title above photo */}
              <h2 className="mb-4 text-xl font-bold text-gray-900 md:hidden">
                About
              </h2>
              {portfolio.profile_image_url ? (
                <img
                  src={portfolio.profile_image_url}
                  alt={portfolio.display_name}
                  className="aspect-square w-40 rounded-2xl object-cover shadow-lg md:w-full"
                />
              ) : (
                <div className="flex aspect-square w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-4xl font-bold text-white shadow-lg md:w-full">
                  {portfolio.display_name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Compact Work Experience */}
              {(portfolio.show_work_experience ?? true) && portfolio.work_experience && portfolio.work_experience.length > 0 && (
                <div className="w-full space-y-6">
                  {/* Current Position(s) */}
                  {portfolio.work_experience.filter((exp) => exp.is_current).length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-900">
                        Now
                      </p>
                      <div className="space-y-3">
                        {portfolio.work_experience
                          .filter((exp) => exp.is_current)
                          .map((exp, index) => (
                            <div key={`current-${index}`} className="flex flex-col">
                              {exp.company_url ? (
                                <a
                                  href={exp.company_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-gray-900 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-blue-600 hover:decoration-blue-400"
                                >
                                  {exp.company}
                                </a>
                              ) : (
                                <span className="text-sm font-medium text-gray-900">{exp.company}</span>
                              )}
                              <span className="text-xs font-medium text-gray-500">{exp.title}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Previous Position(s) */}
                  {portfolio.work_experience.filter((exp) => !exp.is_current).length > 0 && (
                    <div>
                      {/* Desktop: Always show "Previously" label */}
                      <p className="mb-2 hidden text-sm font-semibold uppercase tracking-wider text-gray-900 md:block">
                        Previously
                      </p>
                      {/* Mobile: Expandable button */}
                      <button
                        onClick={() => setShowPreviousRoles(!showPreviousRoles)}
                        className="mb-2 flex w-full items-center justify-between text-sm font-medium text-gray-900 md:hidden"
                        type="button"
                        aria-expanded={showPreviousRoles}
                        aria-controls="previous-roles-list"
                      >
                        <span>{showPreviousRoles ? 'Hide Previous Roles' : 'Show Previous Roles'}</span>
                        {showPreviousRoles ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {/* Previous roles list - hidden on mobile unless expanded */}
                      <div 
                        id="previous-roles-list"
                        className={`space-y-3 ${showPreviousRoles ? 'block' : 'hidden md:block'}`}
                      >
                        {portfolio.work_experience
                          .filter((exp) => !exp.is_current)
                          .map((exp, index) => (
                            <div key={`prev-${index}`} className="flex flex-col">
                              {exp.company_url ? (
                                <a
                                  href={exp.company_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-gray-900 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-blue-600 hover:decoration-blue-400"
                                >
                                  {exp.company}
                                </a>
                              ) : (
                                <span className="text-sm font-medium text-gray-900">{exp.company}</span>
                              )}
                              <span className="text-xs font-medium text-gray-500">{exp.title}</span>
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
                <span className="md:hidden">About Me</span>
                <span className="hidden md:inline">About</span>
              </h2>
              {portfolio.bio && (
                <>
                  <div 
                    className={`portfolio-bio mb-4 text-lg leading-relaxed text-gray-700 md:mb-8 md:text-xl ${
                      showFullBio ? '' : 'line-clamp-4 md:line-clamp-none'
                    }`}
                    dangerouslySetInnerHTML={{ __html: portfolio.bio }}
                  />
                  {/* Mobile: Show more/less button */}
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="mb-8 text-sm font-medium text-gray-600 underline underline-offset-2 transition-colors hover:text-gray-900 md:hidden"
                    type="button"
                    aria-expanded={showFullBio}
                  >
                    {showFullBio ? 'Show less' : 'Show more'}
                  </button>
                </>
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

      {/* Bio HTML Styles */}
      <style jsx global>{`
        .portfolio-bio p {
          margin-bottom: 0.75em;
        }
        .portfolio-bio p:last-child {
          margin-bottom: 0;
        }
        .portfolio-bio strong {
          font-weight: 600;
        }
        .portfolio-bio em {
          font-style: italic;
        }
        .portfolio-bio u {
          text-decoration: underline;
        }
      `}</style>
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tilt
      rotationFactor={6}
      isRevese
      springOptions={{
        stiffness: 26.7,
        damping: 4.1,
        mass: 0.2,
      }}
      className="group w-full max-w-3xl rounded-2xl sm:rounded-[24px] md:rounded-[32px]"
    >
      <Link
        href={`/p/${portfolioSlug}/${page.slug}${previewSuffix}`}
        className="block overflow-hidden rounded-2xl shadow-sm ring-1 ring-gray-100 transition-shadow duration-300 ease-out hover:shadow-xl sm:rounded-[24px] md:rounded-[32px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Cover Image with Title, Description & Tags Overlay */}
      {/* Mobile: taller aspect ratio for better content visibility, Desktop: 2:1 */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 sm:aspect-[2/1]"
      >
        {page.cover_image_url ? (
          <img
            src={page.cover_image_url}
            alt={page.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        {/* Gradient overlay - stronger on mobile for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent sm:from-black/70 sm:via-black/30" />

        {/* Title & Description overlay - bottom left */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6"
          animate={{ y: isHovered ? -40 : 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <h3 className="text-lg font-bold text-white sm:text-xl md:text-2xl">
            {page.title}
          </h3>
          {page.description && (
            <p className="mt-1.5 line-clamp-2 text-xs text-white/80 sm:mt-2 sm:text-sm md:text-base">
              {page.description}
            </p>
          )}
        </motion.div>

        {/* View More button - appears on hover */}
        <motion.div
          className="absolute bottom-0 left-0 p-4 pt-8 sm:p-5 sm:pt-10 md:p-6 md:pt-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{
            y: isHovered ? 0 : 20,
            opacity: isHovered ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900 backdrop-blur-sm sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
            View More
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </span>
        </motion.div>

        {/* Tags overlay - top right (matching detail page style) */}
        {page.tags.length > 0 && (
          <div className="absolute right-3 top-3 flex max-w-[60%] flex-wrap justify-end gap-1 sm:right-4 sm:top-4 sm:max-w-none sm:gap-1.5 md:right-5 md:top-5 md:gap-2">
            {page.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-white/30 bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm sm:rounded-lg sm:px-2 sm:text-[10px] md:px-3 md:py-1 md:text-xs"
              >
                {tag}
              </span>
            ))}
            {page.tags.length > 3 && (
              <span className="rounded-md border border-white/30 bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white/70 backdrop-blur-sm sm:rounded-lg sm:px-2 sm:text-[10px] md:px-3 md:py-1 md:text-xs">
                +{page.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Draft badge overlay in preview mode */}
        {isPreviewMode && !page.is_published && (
          <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
              <span className="h-1 w-1 rounded-full bg-white sm:h-1.5 sm:w-1.5" />
              Draft
            </span>
          </div>
        )}
      </div>
      </Link>
    </Tilt>
  );
};
