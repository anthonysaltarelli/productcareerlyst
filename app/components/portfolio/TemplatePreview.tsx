'use client';

import { PortfolioTemplate } from '@/lib/types/portfolio-templates';
import { PortfolioContent, PageContent, PortfolioTheme, ContentBlock } from '@/lib/types/portfolio-content';
import { getColorValue } from '@/lib/utils/portfolio-colors';
import EditableBlockRenderer from './EditableBlockRenderer';

interface TemplatePreviewProps {
  template: PortfolioTemplate;
  content: PortfolioContent;
  theme: PortfolioTheme;
  selectedItem: PageContent | null;
  view: 'homepage' | 'detail';
  isEditMode: boolean;
  selectedBlockId: string | null;
  onItemClick: (itemId: string) => void;
  onBackToHomepage: () => void;
  onBlockSelect: (blockId: string | null) => void;
  onBlockUpdate: (blockId: string, updates: Partial<ContentBlock['data']>) => void;
}

export default function TemplatePreview({
  template,
  content,
  theme,
  selectedItem,
  view,
  isEditMode,
  selectedBlockId,
  onItemClick,
  onBackToHomepage,
  onBlockSelect,
  onBlockUpdate,
}: TemplatePreviewProps) {
  if (view === 'detail' && selectedItem) {
    // In edit mode, render with editable blocks
    if (isEditMode) {
      const sortedBlocks = [...selectedItem.contentBlocks].sort((a, b) => a.order - b.order);
      
      return (
        <div className="min-h-screen" style={{ backgroundColor: getColorValue(theme.colorPalette.colors.bg) }}>
          {/* Back Button */}
          <div className="px-4 md:px-8 py-6">
            <button
              onClick={onBackToHomepage}
              className={`${theme.fontCombination.bodyFont} transition-colors flex items-center gap-2`}
              style={{ color: getColorValue(theme.colorPalette.colors.primary) }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Portfolio
            </button>
          </div>

          {/* Content */}
          <div 
            className="px-4 md:px-8 py-8 md:py-12 max-w-4xl mx-auto"
            onClick={(e) => {
              // Click outside blocks to deselect
              if (e.target === e.currentTarget) {
                onBlockSelect(null);
              }
            }}
          >
            {sortedBlocks.map((block) => (
              <EditableBlockRenderer
                key={block.id}
                block={block}
                theme={theme}
                isSelected={selectedBlockId === block.id}
                isEditMode={isEditMode}
                onSelect={() => onBlockSelect(block.id)}
                onUpdate={(updates) => onBlockUpdate(block.id, updates)}
              />
            ))}
          </div>
        </div>
      );
    }
    
    // Normal mode - use template renderer
    return (
      <>
        {template.renderDetailPage(selectedItem, theme, onBackToHomepage)}
      </>
    );
  }

  return (
    <>
      {template.renderHomepage(content, theme, onItemClick)}
    </>
  );
}

