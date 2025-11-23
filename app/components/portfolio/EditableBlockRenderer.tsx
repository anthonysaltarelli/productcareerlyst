'use client';

import { ContentBlock, PortfolioTheme } from '@/lib/types/portfolio-content';
import { getColorValue } from '@/lib/utils/portfolio-colors';
import { getSpacingClasses, getAlignmentClasses } from '@/lib/utils/content-blocks';
import EditableBlock from './EditableBlock';
import InlineTextEditor from './InlineTextEditor';

interface EditableBlockRendererProps {
  block: ContentBlock;
  theme: PortfolioTheme;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}

export default function EditableBlockRenderer({
  block,
  theme,
  isSelected,
  isEditMode,
  onSelect,
  onUpdate,
}: EditableBlockRendererProps) {
  const spacingClasses = getSpacingClasses(block.data.spacing);
  const alignmentClasses = getAlignmentClasses(block.data.alignment);

  const renderContent = () => {
    switch (block.type) {
      case 'hero-image':
        return <EditableHeroImageBlock block={block} theme={theme} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'title-description':
        return <EditableTitleDescriptionBlock block={block} theme={theme} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'text':
        return <EditableTextBlock block={block} theme={theme} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'image':
        return <EditableImageBlock block={block} theme={theme} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'two-images':
        return <EditableTwoImagesBlock block={block} theme={theme} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'text-image':
        return <EditableTextImageBlock block={block} theme={theme} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'image-text':
        return <EditableImageTextBlock block={block} theme={theme} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'metrics-grid':
        return <EditableMetricsGridBlock block={block} theme={theme} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'gallery':
        return <EditableGalleryBlock block={block} theme={theme} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'quote':
        return <EditableQuoteBlock block={block} theme={theme} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'section-header':
        return <EditableSectionHeaderBlock block={block} theme={theme} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'spacer':
        return <EditableSpacerBlock block={block} />;
      default:
        return null;
    }
  };

  return (
    <EditableBlock
      block={block}
      theme={theme}
      isSelected={isSelected}
      isEditMode={isEditMode}
      onSelect={onSelect}
      onUpdate={onUpdate}
    >
      {renderContent()}
    </EditableBlock>
  );
}

// Editable Block Components
function EditableHeroImageBlock({
  block,
  theme,
  isEditMode,
  onUpdate,
}: {
  block: ContentBlock;
  theme: PortfolioTheme;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  const image = block.data.images?.[0];

  return (
    <div className="w-full aspect-video overflow-hidden bg-gray-200 relative">
      {image ? (
        <img src={image} alt="Hero" className="w-full h-full object-cover" />
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
      {isEditMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
          <input
            type="text"
            value={image || ''}
            onChange={(e) => onUpdate({ images: [e.target.value] })}
            placeholder="Image URL"
            className="px-3 py-2 bg-white rounded-lg w-3/4"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function EditableTitleDescriptionBlock({
  block,
  theme,
  isEditMode,
  onUpdate,
}: {
  block: ContentBlock;
  theme: PortfolioTheme;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      {isEditMode ? (
        <>
          <InlineTextEditor
            value={block.data.title || ''}
            onSave={(value) => onUpdate({ title: value })}
            onCancel={() => {}}
            placeholder="Title..."
            className={`${theme.fontCombination.headingFont} font-black text-4xl md:text-5xl mb-4`}
            style={{ color: getColorValue(theme.colorPalette.colors.text) }}
          />
          <InlineTextEditor
            value={block.data.description || ''}
            onSave={(value) => onUpdate({ description: value })}
            onCancel={() => {}}
            placeholder="Description..."
            multiline
            className={`${theme.fontCombination.bodyFont} text-lg leading-relaxed`}
            style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
          />
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

function EditableTextBlock({
  block,
  theme,
  isEditMode,
  onUpdate,
}: {
  block: ContentBlock;
  theme: PortfolioTheme;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      {isEditMode ? (
        <InlineTextEditor
          value={block.data.text || ''}
          onSave={(value) => onUpdate({ text: value })}
          onCancel={() => {}}
          placeholder="Text content..."
          multiline
          className={`${theme.fontCombination.bodyFont} leading-relaxed whitespace-pre-wrap ${getAlignmentClasses(block.data.alignment)}`}
          style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
        />
      ) : (
        <p
          className={`${theme.fontCombination.bodyFont} leading-relaxed whitespace-pre-wrap ${getAlignmentClasses(block.data.alignment)}`}
          style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
        >
          {block.data.text || 'No content'}
        </p>
      )}
    </div>
  );
}

function EditableImageBlock({
  block,
  theme,
  isEditMode,
  onUpdate,
}: {
  block: ContentBlock;
  theme: PortfolioTheme;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  const image = block.data.images?.[0];

  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      {image ? (
        <div className="relative">
          <img src={image} alt="Content" className="w-full rounded-lg" />
          {isEditMode && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
              <input
                type="text"
                value={image}
                onChange={(e) => onUpdate({ images: [e.target.value] })}
                placeholder="Image URL"
                className="px-3 py-2 bg-white rounded-lg w-3/4"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          className="w-full aspect-video rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${getColorValue(theme.colorPalette.colors.primary)}1A` }}
        >
          {isEditMode ? (
            <input
              type="text"
              value=""
              onChange={(e) => onUpdate({ images: [e.target.value] })}
              placeholder="Image URL"
              className="px-3 py-2 bg-white rounded-lg w-3/4"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}>
              No image
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function EditableTwoImagesBlock({
  block,
  theme,
  isEditMode,
  onUpdate,
}: {
  block: ContentBlock;
  theme: PortfolioTheme;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  const images = block.data.images || [];
  const layout = block.data.imageLayout || 'side-by-side';

  if (layout === 'stacked') {
    return (
      <div className={`${getSpacingClasses(block.data.spacing)} space-y-4`}>
        {images.map((img, idx) => (
          <div key={idx} className="relative">
            <img src={img} alt={`Image ${idx + 1}`} className="w-full rounded-lg" />
            {isEditMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                <input
                  type="text"
                  value={img}
                  onChange={(e) => {
                    const newImages = [...images];
                    newImages[idx] = e.target.value;
                    onUpdate({ images: newImages });
                  }}
                  placeholder="Image URL"
                  className="px-3 py-2 bg-white rounded-lg w-3/4"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${getSpacingClasses(block.data.spacing)} grid grid-cols-1 md:grid-cols-2 gap-4`}>
      {images.slice(0, 2).map((img, idx) => (
        <div key={idx} className="relative">
          <img src={img} alt={`Image ${idx + 1}`} className="w-full rounded-lg" />
          {isEditMode && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
              <input
                type="text"
                value={img}
                onChange={(e) => {
                  const newImages = [...images];
                  newImages[idx] = e.target.value;
                  onUpdate({ images: newImages });
                }}
                placeholder="Image URL"
                className="px-3 py-2 bg-white rounded-lg w-3/4"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EditableTextImageBlock({
  block,
  theme,
  isEditMode,
  onUpdate,
}: {
  block: ContentBlock;
  theme: PortfolioTheme;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  const image = block.data.images?.[0];

  return (
    <div className={`${getSpacingClasses(block.data.spacing)} grid grid-cols-1 md:grid-cols-2 gap-8`}>
      <div className="flex items-center">
        {isEditMode ? (
          <InlineTextEditor
            value={block.data.text || ''}
            onSave={(value) => onUpdate({ text: value })}
            onCancel={() => {}}
            placeholder="Text content..."
            multiline
            className={`${theme.fontCombination.bodyFont} leading-relaxed w-full`}
            style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
          />
        ) : (
          <p
            className={`${theme.fontCombination.bodyFont} leading-relaxed`}
            style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
          >
            {block.data.text || 'No content'}
          </p>
        )}
      </div>
      <div className="relative">
        {image ? (
          <>
            <img src={image} alt="Content" className="w-full rounded-lg" />
            {isEditMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                <input
                  type="text"
                  value={image}
                  onChange={(e) => onUpdate({ images: [e.target.value] })}
                  placeholder="Image URL"
                  className="px-3 py-2 bg-white rounded-lg w-3/4"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        ) : (
          <div
            className="w-full aspect-video rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${getColorValue(theme.colorPalette.colors.primary)}1A` }}
          >
            {isEditMode ? (
              <input
                type="text"
                value=""
                onChange={(e) => onUpdate({ images: [e.target.value] })}
                placeholder="Image URL"
                className="px-3 py-2 bg-white rounded-lg w-3/4"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}>
                No image
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EditableImageTextBlock({
  block,
  theme,
  isEditMode,
  onUpdate,
}: {
  block: ContentBlock;
  theme: PortfolioTheme;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  const image = block.data.images?.[0];

  return (
    <div className={`${getSpacingClasses(block.data.spacing)} grid grid-cols-1 md:grid-cols-2 gap-8`}>
      <div className="relative">
        {image ? (
          <>
            <img src={image} alt="Content" className="w-full rounded-lg" />
            {isEditMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                <input
                  type="text"
                  value={image}
                  onChange={(e) => onUpdate({ images: [e.target.value] })}
                  placeholder="Image URL"
                  className="px-3 py-2 bg-white rounded-lg w-3/4"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        ) : (
          <div
            className="w-full aspect-video rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${getColorValue(theme.colorPalette.colors.primary)}1A` }}
          >
            {isEditMode ? (
              <input
                type="text"
                value=""
                onChange={(e) => onUpdate({ images: [e.target.value] })}
                placeholder="Image URL"
                className="px-3 py-2 bg-white rounded-lg w-3/4"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}>
                No image
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center">
        {isEditMode ? (
          <InlineTextEditor
            value={block.data.text || ''}
            onSave={(value) => onUpdate({ text: value })}
            onCancel={() => {}}
            placeholder="Text content..."
            multiline
            className={`${theme.fontCombination.bodyFont} leading-relaxed w-full`}
            style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
          />
        ) : (
          <p
            className={`${theme.fontCombination.bodyFont} leading-relaxed`}
            style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
          >
            {block.data.text || 'No content'}
          </p>
        )}
      </div>
    </div>
  );
}

function EditableMetricsGridBlock({
  block,
  theme,
  isEditMode,
  onUpdate,
}: {
  block: ContentBlock;
  theme: PortfolioTheme;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  const metrics = block.data.metrics || [];

  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="p-4 border-2 rounded-lg relative"
            style={{ borderColor: `${getColorValue(theme.colorPalette.colors.primary)}33` }}
          >
            {isEditMode ? (
              <div className="space-y-2">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    onUpdate({
                      metrics: metrics.map((m) =>
                        m.id === metric.id ? { ...m, label: e.currentTarget.textContent || '' } : m
                      ),
                    });
                  }}
                  onBlur={(e) => {
                    if (!e.currentTarget.textContent?.trim()) {
                      e.currentTarget.textContent = metric.label;
                    }
                  }}
                  className="text-sm outline-none border-2 border-blue-500 rounded px-2 py-1 min-h-[1.5em]"
                  style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {metric.label}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    onUpdate({
                      metrics: metrics.map((m) =>
                        m.id === metric.id ? { ...m, value: e.currentTarget.textContent || '' } : m
                      ),
                    });
                  }}
                  onBlur={(e) => {
                    if (!e.currentTarget.textContent?.trim()) {
                      e.currentTarget.textContent = metric.value;
                    }
                  }}
                  className={`outline-none border-2 border-blue-500 rounded px-2 py-1 min-h-[1.5em] ${theme.fontCombination.headingFont} font-bold text-2xl`}
                  style={{ color: getColorValue(theme.colorPalette.colors.primary) }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {metric.value}
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm mb-1" style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}>
                  {metric.label}
                </div>
                <div
                  className={`${theme.fontCombination.headingFont} font-bold text-2xl`}
                  style={{ color: getColorValue(theme.colorPalette.colors.primary) }}
                >
                  {metric.value}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableGalleryBlock({
  block,
  theme,
  isEditMode,
  onUpdate,
}: {
  block: ContentBlock;
  theme: PortfolioTheme;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  const images = block.data.images || [];
  const columns = block.data.galleryColumns || 2;
  const gridColsClass =
    columns === 1 ? 'md:grid-cols-1' :
    columns === 2 ? 'md:grid-cols-2' :
    columns === 3 ? 'md:grid-cols-3' :
    'md:grid-cols-4';

  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      <div className={`grid grid-cols-1 ${gridColsClass} gap-4`}>
        {images.map((img, idx) => (
          <div key={idx} className="aspect-video overflow-hidden rounded-lg bg-gray-200 relative">
            <img src={img} alt={`Gallery image ${idx + 1}`} className="w-full h-full object-cover" />
            {isEditMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                <input
                  type="text"
                  value={img}
                  onChange={(e) => {
                    const newImages = [...images];
                    newImages[idx] = e.target.value;
                    onUpdate({ images: newImages });
                  }}
                  placeholder="Image URL"
                  className="px-3 py-2 bg-white rounded-lg w-3/4"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableQuoteBlock({
  block,
  theme,
  isEditMode,
  onUpdate,
}: {
  block: ContentBlock;
  theme: PortfolioTheme;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      <blockquote className="border-l-4 pl-6" style={{ borderColor: getColorValue(theme.colorPalette.colors.primary) }}>
        {isEditMode ? (
          <div className="space-y-2">
            <InlineTextEditor
              value={block.data.quote || ''}
              onSave={(value) => onUpdate({ quote: value })}
              onCancel={() => {}}
              placeholder="Quote..."
              multiline
              className={`${theme.fontCombination.bodyFont} text-xl italic`}
              style={{ color: getColorValue(theme.colorPalette.colors.text) }}
            />
            <InlineTextEditor
              value={block.data.attribution || ''}
              onSave={(value) => onUpdate({ attribution: value })}
              onCancel={() => {}}
              placeholder="Attribution..."
              className={`${theme.fontCombination.bodyFont} text-sm`}
              style={{ color: getColorValue(theme.colorPalette.colors.textSecondary) }}
            />
          </div>
        ) : (
          <>
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
          </>
        )}
      </blockquote>
    </div>
  );
}

function EditableSectionHeaderBlock({
  block,
  theme,
  isEditMode,
  onUpdate,
}: {
  block: ContentBlock;
  theme: PortfolioTheme;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  return (
    <div className={getSpacingClasses(block.data.spacing)}>
      {isEditMode ? (
        <InlineTextEditor
          value={block.data.title || ''}
          onSave={(value) => onUpdate({ title: value })}
          onCancel={() => {}}
          placeholder="Section title..."
          className={`${theme.fontCombination.headingFont} font-bold text-2xl md:text-3xl`}
          style={{ color: getColorValue(theme.colorPalette.colors.text) }}
        />
      ) : (
        <h2
          className={`${theme.fontCombination.headingFont} font-bold text-2xl md:text-3xl`}
          style={{ color: getColorValue(theme.colorPalette.colors.text) }}
        >
          {block.data.title || 'Section'}
        </h2>
      )}
    </div>
  );
}

function EditableSpacerBlock({ block }: { block: ContentBlock }) {
  const height = block.data.height || 'medium';
  const heightClass =
    height === 'small' ? 'h-8' : height === 'large' ? 'h-24' : height === 'xlarge' ? 'h-32' : 'h-16';

  return <div className={heightClass} />;
}

