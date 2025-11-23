'use client';

import { ColorPalette } from '@/lib/constants/portfolio-palettes';
import { FontCombination } from '@/lib/constants/portfolio-fonts';
import { getColorValue } from '@/lib/utils/portfolio-colors';
import { PageContent, PortfolioSection } from '@/lib/types/portfolio-content';
import CaseStudyCarousel from './CaseStudyCarousel';

interface ModernMinimalistHomepageProps {
  siteTitle: string;
  siteSubtitle: string;
  bio: string;
  sections: PortfolioSection[];
  colorPalette: ColorPalette;
  fontCombination: FontCombination;
  onItemClick: (itemId: string) => void;
}

export default function ModernMinimalistHomepage({
  siteTitle,
  siteSubtitle,
  bio,
  sections,
  colorPalette,
  fontCombination,
  onItemClick,
}: ModernMinimalistHomepageProps) {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen" style={{ backgroundColor: getColorValue(colorPalette.colors.bg) }}>
      {/* Header */}
      <header className="px-4 md:px-8 py-8 md:py-12">
        <h1
          className={`${fontCombination.headingFont} font-black text-4xl md:text-5xl mb-2`}
          style={{ color: getColorValue(colorPalette.colors.text) }}
        >
          {siteTitle || 'Product Portfolio'}
        </h1>
        {siteSubtitle && (
          <p
            className={`${fontCombination.bodyFont} text-lg md:text-xl`}
            style={{ color: getColorValue(colorPalette.colors.textSecondary) }}
          >
            {siteSubtitle}
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
                className={`${fontCombination.headingFont} font-light text-2xl md:text-3xl`}
                style={{ color: getColorValue(colorPalette.colors.text) }}
              >
                {section.title}
              </h2>
            </div>

            {/* Section Carousel */}
            <div>
              <CaseStudyCarousel
                caseStudies={section.items}
                colorPalette={colorPalette}
                fontCombination={fontCombination}
                onCardClick={onItemClick}
              />
            </div>
          </div>
        )
      ))}

      {/* Bio Section */}
      {bio && (
        <div className="px-4 md:px-8 py-12 md:py-16">
          <div className="max-w-4xl">
            <p
              className={`${fontCombination.bodyFont} text-lg md:text-xl leading-relaxed whitespace-pre-wrap`}
              style={{ color: getColorValue(colorPalette.colors.text) }}
            >
              {bio}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

