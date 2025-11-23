'use client';

import { ColorPalette } from '@/lib/constants/portfolio-palettes';
import { FontCombination } from '@/lib/constants/portfolio-fonts';
import { getColorValue } from '@/lib/utils/portfolio-colors';
import { PageContent } from '@/lib/types/portfolio-content';

interface CaseStudyCarouselProps {
  caseStudies: PageContent[];
  colorPalette: ColorPalette;
  fontCombination: FontCombination;
  onCardClick: (itemId: string) => void;
}

export default function CaseStudyCarousel({
  caseStudies,
  colorPalette,
  fontCombination,
  onCardClick,
}: CaseStudyCarouselProps) {
  const sortedCaseStudies = [...caseStudies].sort((a, b) => a.order - b.order);
  
  // Helper to convert PageContent to display format
  const getDisplayData = (item: PageContent) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    heroImage: item.heroImage,
    tags: item.tags || [],
  });

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-6 px-4 md:px-8">
        {sortedCaseStudies.map((caseStudy) => {
          const display = getDisplayData(caseStudy);
          return (
            <div
              key={caseStudy.id}
              onClick={() => onCardClick(caseStudy.id)}
              className="flex-shrink-0 cursor-pointer group"
              style={{ width: '320px', height: '480px' }}
            >
              <div
                className="relative w-full h-full border rounded-[2rem] overflow-hidden transition-all duration-200 hover:shadow-lg"
                style={{
                  borderColor: `${getColorValue(colorPalette.colors.primary)}33`,
                  borderWidth: '1px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${getColorValue(colorPalette.colors.primary)}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${getColorValue(colorPalette.colors.primary)}33`;
                }}
              >
                {/* Hero Image - Full Bleed */}
                <div className="absolute inset-0 w-full h-full">
                  {display.heroImage ? (
                    <img
                      src={display.heroImage}
                      alt={display.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${getColorValue(colorPalette.colors.primary)}1A` }}
                    >
                      <span className="text-sm" style={{ color: getColorValue(colorPalette.colors.textSecondary) }}>
                        No image
                      </span>
                    </div>
                  )}
                </div>

                {/* Gradient Overlay for Text Readability */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                />

                {/* Card Content - Overlay on Image */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                  <h3
                    className={`${fontCombination.headingFont} font-light text-2xl md:text-3xl mb-3 line-clamp-2 text-white`}
                  >
                    {display.title || 'Untitled Case Study'}
                  </h3>
                  
                  {/* Tags */}
                  {display.tags && display.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {display.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

