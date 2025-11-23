import { PortfolioTemplate } from '@/lib/types/portfolio-templates';
import { PortfolioContent, PageContent, PortfolioTheme } from '@/lib/types/portfolio-content';
import { getColorValue } from '@/lib/utils/portfolio-colors';
import BlockRenderer from '@/app/components/portfolio/blocks/BlockRenderer';
import CaseStudyCarousel from '@/app/components/portfolio/CaseStudyCarousel';

// Modern Minimalist Template
const modernMinimalistTemplate: PortfolioTemplate = {
  id: 'modern-minimalist',
  name: 'Modern Minimalist',
  description: 'Clean, professional design with focus on content and white space.',
  icon: '✨',
  
  renderHomepage: (content, theme, onItemClick) => {
    const sortedSections = [...content.sections].sort((a, b) => a.order - b.order);
    
    return (
      <div className="min-h-screen" style={{ backgroundColor: getColorValue(theme.colorPalette.colors.bg) }}>
        {/* Header */}
        <header className="px-4 md:px-8 py-8 md:py-12">
          <h1
            className={`${theme.fontCombination.headingFont} font-black text-4xl md:text-5xl mb-2`}
            style={{ color: getColorValue(theme.colorPalette.colors.text) }}
          >
            {content.siteTitle || 'Product Portfolio'}
          </h1>
          {content.siteSubtitle && (
            <p
              className={`${theme.fontCombination.bodyFont} text-lg md:text-xl`}
              style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
            >
              {content.siteSubtitle}
            </p>
          )}
        </header>

        {/* Sections */}
        {sortedSections.map((section) => (
          section.items && section.items.length > 0 && (
            <div key={section.id} className="mt-12 md:mt-16">
              {/* Section Title */}
              <div className="px-4 md:px-8 mb-6">
                <h2
                  className={`${theme.fontCombination.headingFont} font-light text-2xl md:text-3xl`}
                  style={{ color: getColorValue(theme.colorPalette.colors.text) }}
                >
                  {section.title}
                </h2>
              </div>

              {/* Section Carousel */}
              <div>
                <CaseStudyCarousel
                  caseStudies={section.items}
                  colorPalette={theme.colorPalette}
                  fontCombination={theme.fontCombination}
                  onCardClick={onItemClick}
                />
              </div>
            </div>
          )
        ))}

        {/* Bio Section */}
        {content.bio && (
          <div className="px-4 md:px-8 py-12 md:py-16">
            <div className="max-w-4xl">
              <p
                className={`${theme.fontCombination.bodyFont} text-lg md:text-xl leading-relaxed whitespace-pre-wrap`}
                style={{ color: getColorValue(theme.colorPalette.colors.text) }}
              >
                {content.bio}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
  
  renderDetailPage: (pageContent, theme, onBack) => {
    const sortedBlocks = [...pageContent.contentBlocks].sort((a, b) => a.order - b.order);
    
    return (
      <div className="min-h-screen" style={{ backgroundColor: getColorValue(theme.colorPalette.colors.bg) }}>
        {/* Back Button */}
        <div className="px-4 md:px-8 py-6">
          <button
            onClick={onBack}
            className={`${theme.fontCombination.bodyFont} transition-colors flex items-center gap-2`}
            style={{ color: getColorValue(theme.colorPalette.colors.primary) }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = getColorValue(theme.colorPalette.colors.accent);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = getColorValue(theme.colorPalette.colors.primary);
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Portfolio
          </button>
        </div>

        {/* Content */}
        <div className="px-4 md:px-8 py-8 md:py-12 max-w-4xl mx-auto">
          {/* Render all blocks in order */}
          {sortedBlocks.map((block) => (
            <BlockRenderer key={block.id} block={block} theme={theme} />
          ))}
        </div>
      </div>
    );
  },
  
  renderBlock: (block, theme) => {
    return <BlockRenderer block={block} theme={theme} />;
  },
  
  themeOptions: {
    spacing: true,
    borderRadius: true,
  },
};

// Template Registry
export const PORTFOLIO_TEMPLATES: PortfolioTemplate[] = [
  modernMinimalistTemplate,
];

export const getTemplate = (templateId: string): PortfolioTemplate | undefined => {
  return PORTFOLIO_TEMPLATES.find((t) => t.id === templateId);
};

