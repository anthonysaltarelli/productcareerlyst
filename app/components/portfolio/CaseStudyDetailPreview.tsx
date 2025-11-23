'use client';

import { ColorPalette } from '@/lib/constants/portfolio-palettes';
import { FontCombination } from '@/lib/constants/portfolio-fonts';
import { getColorValue } from '@/lib/utils/portfolio-colors';

interface Metric {
  id: string;
  label: string;
  value: string;
}

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  heroImage: string;
  problemDiscover: string;
  problemDefine: string;
  solutionDevelop: string;
  solutionDeliver: string;
  process: string;
  metrics: Metric[];
  outcomes: string;
  images: string[];
  tags: string[];
}

interface CaseStudyDetailPreviewProps {
  caseStudy: CaseStudy | null;
  colorPalette: ColorPalette;
  fontCombination: FontCombination;
  onBack: () => void;
}

export default function CaseStudyDetailPreview({
  caseStudy,
  colorPalette,
  fontCombination,
  onBack,
}: CaseStudyDetailPreviewProps) {
  if (!caseStudy) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: getColorValue(colorPalette.colors.bg) }}
      >
        <p style={{ color: getColorValue(colorPalette.colors.textSecondary) }}>No case study selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: getColorValue(colorPalette.colors.bg) }}>
      {/* Back Button */}
      <div className="px-4 md:px-8 py-6">
        <button
          onClick={onBack}
          className={`${fontCombination.bodyFont} transition-colors flex items-center gap-2`}
          style={{ color: getColorValue(colorPalette.colors.primary) }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = getColorValue(colorPalette.colors.accent);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = getColorValue(colorPalette.colors.primary);
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Portfolio
        </button>
      </div>

      {/* Hero Image */}
      <div className="w-full aspect-video overflow-hidden bg-gray-200">
        {caseStudy.heroImage ? (
          <img
            src={caseStudy.heroImage}
            alt={caseStudy.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${getColorValue(colorPalette.colors.primary)}1A` }}
          >
            <span style={{ color: getColorValue(colorPalette.colors.textSecondary) }}>No hero image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-8 md:py-12 max-w-4xl mx-auto">
        {/* Title and Description */}
        <div className="mb-12">
          <h1
            className={`${fontCombination.headingFont} font-black text-4xl md:text-5xl mb-4`}
            style={{ color: getColorValue(colorPalette.colors.text) }}
          >
            {caseStudy.title || 'Untitled Case Study'}
          </h1>
          <p
            className={`${fontCombination.bodyFont} text-lg leading-relaxed`}
            style={{ color: getColorValue(colorPalette.colors.textSecondary) }}
          >
            {caseStudy.description || 'No description'}
          </p>
        </div>

        {/* Problem Section */}
        <section className="mb-12">
          <h2
            className={`${fontCombination.headingFont} font-bold text-2xl md:text-3xl mb-6`}
            style={{ color: getColorValue(colorPalette.colors.text) }}
          >
            Problem
          </h2>
          <div className="space-y-6">
            <div>
              <h3
                className={`${fontCombination.headingFont} font-semibold text-xl mb-3`}
                style={{ color: getColorValue(colorPalette.colors.primary) }}
              >
                Discover
              </h3>
              <p
                className={`${fontCombination.bodyFont} leading-relaxed whitespace-pre-wrap`}
                style={{ color: getColorValue(colorPalette.colors.textSecondary) }}
              >
                {caseStudy.problemDiscover || 'No content'}
              </p>
            </div>
            <div>
              <h3
                className={`${fontCombination.headingFont} font-semibold text-xl mb-3`}
                style={{ color: getColorValue(colorPalette.colors.primary) }}
              >
                Define
              </h3>
              <p
                className={`${fontCombination.bodyFont} leading-relaxed whitespace-pre-wrap`}
                style={{ color: getColorValue(colorPalette.colors.textSecondary) }}
              >
                {caseStudy.problemDefine || 'No content'}
              </p>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="mb-12">
          <h2
            className={`${fontCombination.headingFont} font-bold text-2xl md:text-3xl mb-6`}
            style={{ color: getColorValue(colorPalette.colors.text) }}
          >
            Solution
          </h2>
          <div className="space-y-6">
            <div>
              <h3
                className={`${fontCombination.headingFont} font-semibold text-xl mb-3`}
                style={{ color: getColorValue(colorPalette.colors.primary) }}
              >
                Develop
              </h3>
              <p
                className={`${fontCombination.bodyFont} leading-relaxed whitespace-pre-wrap`}
                style={{ color: getColorValue(colorPalette.colors.textSecondary) }}
              >
                {caseStudy.solutionDevelop || 'No content'}
              </p>
            </div>
            <div>
              <h3
                className={`${fontCombination.headingFont} font-semibold text-xl mb-3`}
                style={{ color: getColorValue(colorPalette.colors.primary) }}
              >
                Deliver
              </h3>
              <p
                className={`${fontCombination.bodyFont} leading-relaxed whitespace-pre-wrap`}
                style={{ color: getColorValue(colorPalette.colors.textSecondary) }}
              >
                {caseStudy.solutionDeliver || 'No content'}
              </p>
            </div>
          </div>
        </section>

        {/* Process Section */}
        {caseStudy.process && (
          <section className="mb-12">
            <h2
              className={`${fontCombination.headingFont} font-bold text-2xl md:text-3xl mb-6`}
              style={{ color: getColorValue(colorPalette.colors.text) }}
            >
              Process
            </h2>
            <p
              className={`${fontCombination.bodyFont} leading-relaxed whitespace-pre-wrap`}
              style={{ color: getColorValue(colorPalette.colors.textSecondary) }}
            >
              {caseStudy.process}
            </p>
          </section>
        )}

        {/* Results Section */}
        <section className="mb-12">
          <h2
            className={`${fontCombination.headingFont} font-bold text-2xl md:text-3xl mb-6`}
            style={{ color: getColorValue(colorPalette.colors.text) }}
          >
            Results
          </h2>
          {caseStudy.metrics && caseStudy.metrics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {caseStudy.metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="p-4 border-2 rounded-lg"
                  style={{ borderColor: `${getColorValue(colorPalette.colors.primary)}33` }}
                >
                  <div className="text-sm mb-1" style={{ color: getColorValue(colorPalette.colors.textSecondary) }}>
                    {metric.label}
                  </div>
                  <div className={`${fontCombination.headingFont} font-bold text-2xl`} style={{ color: getColorValue(colorPalette.colors.primary) }}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          )}
          {caseStudy.outcomes && (
            <p
              className={`${fontCombination.bodyFont} leading-relaxed whitespace-pre-wrap`}
              style={{ color: getColorValue(colorPalette.colors.textSecondary) }}
            >
              {caseStudy.outcomes}
            </p>
          )}
        </section>

        {/* Image Gallery */}
        {caseStudy.images && caseStudy.images.length > 0 && (
          <section className="mb-12">
            <h2
              className={`${fontCombination.headingFont} font-bold text-2xl md:text-3xl mb-6`}
              style={{ color: getColorValue(colorPalette.colors.text) }}
            >
              Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseStudy.images.map((image, index) => (
                <div key={index} className="aspect-video overflow-hidden rounded-lg bg-gray-200">
                  <img
                    src={image}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {caseStudy.tags && caseStudy.tags.length > 0 && (
          <section>
            <div className="flex flex-wrap gap-2">
              {caseStudy.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: `${getColorValue(colorPalette.colors.primary)}1A`,
                    color: getColorValue(colorPalette.colors.primary),
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

