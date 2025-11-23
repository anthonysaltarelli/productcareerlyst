'use client';

import { ColorPalette } from '@/lib/constants/portfolio-palettes';
import { FontCombination } from '@/lib/constants/portfolio-fonts';
import { getColorValue } from '@/lib/utils/portfolio-colors';
import CaseStudyCarousel from './CaseStudyCarousel';

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  heroImage: string;
  tags: string[];
  order: number;
}

interface ModernMinimalistHomepageProps {
  siteTitle: string;
  siteSubtitle: string;
  bio: string;
  caseStudies: CaseStudy[];
  colorPalette: ColorPalette;
  fontCombination: FontCombination;
  onCaseStudyClick: (caseStudyId: string) => void;
}

export default function ModernMinimalistHomepage({
  siteTitle,
  siteSubtitle,
  bio,
  caseStudies,
  colorPalette,
  fontCombination,
  onCaseStudyClick,
}: ModernMinimalistHomepageProps) {
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

      {/* Carousel */}
      <div className="mt-8">
        <CaseStudyCarousel
          caseStudies={caseStudies}
          colorPalette={colorPalette}
          fontCombination={fontCombination}
          onCardClick={onCaseStudyClick}
        />
      </div>

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

