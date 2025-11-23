'use client';

import { ContentBlock, PortfolioTheme } from '@/lib/types/portfolio-content';
import { getColorValue } from '@/lib/utils/portfolio-colors';
import { getSpacingClasses, getAlignmentClasses } from '@/lib/utils/content-blocks';

interface BlockRendererProps {
  block: ContentBlock;
  theme: PortfolioTheme;
}

export default function BlockRenderer({ block, theme }: BlockRendererProps) {
  const spacingClasses = getSpacingClasses(block.data.spacing);
  const alignmentClasses = getAlignmentClasses(block.data.alignment);

  switch (block.type) {
    case 'hero-image':
      return <HeroImageBlock block={block} theme={theme} />;
    case 'title-description':
      return <TitleDescriptionBlock block={block} theme={theme} />;
    case 'text':
      return <TextBlock block={block} theme={theme} />;
    case 'image':
      return <ImageBlock block={block} theme={theme} />;
    case 'two-images':
      return <TwoImagesBlock block={block} theme={theme} />;
    case 'text-image':
      return <TextImageBlock block={block} theme={theme} />;
    case 'image-text':
      return <ImageTextBlock block={block} theme={theme} />;
    case 'metrics-grid':
      return <MetricsGridBlock block={block} theme={theme} />;
    case 'gallery':
      return <GalleryBlock block={block} theme={theme} />;
    case 'quote':
      return <QuoteBlock block={block} theme={theme} />;
    case 'section-header':
      return <SectionHeaderBlock block={block} theme={theme} />;
    case 'spacer':
      return <SpacerBlock block={block} />;
    default:
      return null;
  }
}

// Hero Image Block
function HeroImageBlock({ block, theme }: BlockRendererProps) {
  const image = block.data.images?.[0];
  
  return (
    <div className="w-full aspect-video overflow-hidden bg-gray-200">
      {image ? (
        <img
          src={image}
          alt="Hero"
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: `${getColorValue(theme.colorPalette.colors.primary)}1A` }}
        >
          <span style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}>
            No hero image
          </span>
        </div>
      )}
    </div>
  );
}

// Title Description Block
function TitleDescriptionBlock({ block, theme }: BlockRendererProps) {
  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      {block.data.title && (
        <h1
          className={`${theme.fontCombination.headingFont} font-black text-4xl md:text-5xl mb-4`}
          style={{ color: getColorValue(theme.colorPalette.colors.text) }}
        >
          {block.data.title}
        </h1>
      )}
      {block.data.description && (
        <p
          className={`${theme.fontCombination.bodyFont} text-lg leading-relaxed`}
          style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
        >
          {block.data.description}
        </p>
      )}
    </div>
  );
}

// Text Block
function TextBlock({ block, theme }: BlockRendererProps) {
  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      <p
        className={`${theme.fontCombination.bodyFont} leading-relaxed whitespace-pre-wrap ${getAlignmentClasses(block.data.alignment)}`}
        style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
      >
        {block.data.text || 'No content'}
      </p>
    </div>
  );
}

// Image Block
function ImageBlock({ block, theme }: BlockRendererProps) {
  const image = block.data.images?.[0];
  
  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      {image ? (
        <img
          src={image}
          alt="Content"
          className="w-full rounded-lg"
        />
      ) : (
        <div
          className="w-full aspect-video rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${getColorValue(theme.colorPalette.colors.primary)}1A` }}
        >
          <span style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}>
            No image
          </span>
        </div>
      )}
    </div>
  );
}

// Two Images Block
function TwoImagesBlock({ block, theme }: BlockRendererProps) {
  const images = block.data.images || [];
  const layout = block.data.imageLayout || 'side-by-side';
  
  if (layout === 'stacked') {
    return (
      <div className={`${getSpacingClasses(block.data.spacing)} space-y-4`}>
        {images.map((img, idx) => (
          <img key={idx} src={img} alt={`Image ${idx + 1}`} className="w-full rounded-lg" />
        ))}
      </div>
    );
  }
  
  return (
    <div className={`${getSpacingClasses(block.data.spacing)} grid grid-cols-1 md:grid-cols-2 gap-4`}>
      {images.slice(0, 2).map((img, idx) => (
        <img key={idx} src={img} alt={`Image ${idx + 1}`} className="w-full rounded-lg" />
      ))}
    </div>
  );
}

// Text Image Block (text left, image right)
function TextImageBlock({ block, theme }: BlockRendererProps) {
  const image = block.data.images?.[0];
  const alignment = block.data.imageAlignment || 'right';
  
  return (
    <div className={`${getSpacingClasses(block.data.spacing)} grid grid-cols-1 md:grid-cols-2 gap-8`}>
      <div className="flex items-center">
        <p
          className={`${theme.fontCombination.bodyFont} leading-relaxed`}
          style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
        >
          {block.data.text || 'No content'}
        </p>
      </div>
      <div>
        {image ? (
          <img src={image} alt="Content" className="w-full rounded-lg" />
        ) : (
          <div
            className="w-full aspect-video rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${getColorValue(theme.colorPalette.colors.primary)}1A` }}
          >
            <span style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}>
              No image
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Image Text Block (image left, text right)
function ImageTextBlock({ block, theme }: BlockRendererProps) {
  const image = block.data.images?.[0];
  
  return (
    <div className={`${getSpacingClasses(block.data.spacing)} grid grid-cols-1 md:grid-cols-2 gap-8`}>
      <div>
        {image ? (
          <img src={image} alt="Content" className="w-full rounded-lg" />
        ) : (
          <div
            className="w-full aspect-video rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${getColorValue(theme.colorPalette.colors.primary)}1A` }}
          >
            <span style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}>
              No image
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center">
        <p
          className={`${theme.fontCombination.bodyFont} leading-relaxed`}
          style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
        >
          {block.data.text || 'No content'}
        </p>
      </div>
    </div>
  );
}

// Metrics Grid Block
function MetricsGridBlock({ block, theme }: BlockRendererProps) {
  const metrics = block.data.metrics || [];
  
  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="p-4 border-2 rounded-lg"
            style={{ borderColor: `${getColorValue(theme.colorPalette.colors.primary)}33` }}
          >
            <div className="text-sm mb-1" style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}>
              {metric.label}
            </div>
            <div
              className={`${theme.fontCombination.headingFont} font-bold text-2xl`}
              style={{ color: getColorValue(theme.colorPalette.colors.primary) }}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Gallery Block
function GalleryBlock({ block, theme }: BlockRendererProps) {
  const images = block.data.images || [];
  const columns = block.data.galleryColumns || 2;
  
  // Map columns to Tailwind classes
  const gridColsClass = 
    columns === 1 ? 'md:grid-cols-1' :
    columns === 2 ? 'md:grid-cols-2' :
    columns === 3 ? 'md:grid-cols-3' :
    'md:grid-cols-4';
  
  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      <div className={`grid grid-cols-1 ${gridColsClass} gap-4`}>
        {images.map((img, idx) => (
          <div key={idx} className="aspect-video overflow-hidden rounded-lg bg-gray-200">
            <img
              src={img}
              alt={`Gallery image ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Quote Block
function QuoteBlock({ block, theme }: BlockRendererProps) {
  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      <blockquote className="border-l-4 pl-6" style={{ borderColor: getColorValue(theme.colorPalette.colors.primary) }}>
        <p
          className={`${theme.fontCombination.bodyFont} text-xl italic mb-2`}
          style={{ color: getColorValue(theme.colorPalette.colors.text) }}
        >
          {block.data.quote || 'No quote'}
        </p>
        {block.data.attribution && (
          <cite
            className={`${theme.fontCombination.bodyFont} text-sm`}
            style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
          >
            — {block.data.attribution}
          </cite>
        )}
      </blockquote>
    </div>
  );
}

// Section Header Block
function SectionHeaderBlock({ block, theme }: BlockRendererProps) {
  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      <h2
        className={`${theme.fontCombination.headingFont} font-bold text-2xl md:text-3xl`}
        style={{ color: getColorValue(theme.colorPalette.colors.text) }}
      >
        {block.data.title || 'Section'}
      </h2>
    </div>
  );
}

// Spacer Block
function SpacerBlock({ block }: { block: ContentBlock }) {
  const height = block.data.height || 'medium';
  const heightClass = height === 'small' ? 'h-8' : height === 'large' ? 'h-24' : height === 'xlarge' ? 'h-32' : 'h-16';
  
  return <div className={heightClass} />;
}

