'use client';

import { useState, useRef, useEffect } from 'react';
import { ContentBlock, PortfolioTheme } from '@/lib/types/portfolio-content';

interface EditableBlockProps {
  block: ContentBlock;
  theme: PortfolioTheme;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
  children: React.ReactNode;
}

export default function EditableBlock({
  block,
  theme,
  isSelected,
  isEditMode,
  onSelect,
  onUpdate,
  children,
}: EditableBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const showGuidelines = isEditMode && (isSelected || isHovered);

  return (
    <div
      ref={containerRef}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (isEditMode) {
          e.stopPropagation();
          onSelect();
        }
      }}
      onMouseDown={(e) => {
        if (isEditMode) {
          e.stopPropagation();
        }
      }}
    >
      {/* Guidelines/Outline */}
      {showGuidelines && (
        <div
          className={`absolute inset-0 pointer-events-none z-10 ${
            isSelected ? 'border-2 border-blue-500' : 'border-2 border-blue-300 border-dashed'
          }`}
          style={{
            margin: isSelected ? '-2px' : '-2px',
          }}
        >
          {/* Block Type Label */}
          {isSelected && (
            <div className="absolute -top-6 left-0 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-t">
              {getBlockTypeLabel(block.type)}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={showGuidelines ? 'opacity-100' : ''}>
        {children}
      </div>
    </div>
  );
}

function getBlockTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'hero-image': 'Hero Image',
    'title-description': 'Title & Description',
    'text': 'Text',
    'image': 'Image',
    'two-images': 'Two Images',
    'text-image': 'Text + Image',
    'image-text': 'Image + Text',
    'metrics-grid': 'Metrics',
    'gallery': 'Gallery',
    'quote': 'Quote',
    'section-header': 'Section Header',
    'spacer': 'Spacer',
  };
  return labels[type] || type;
}

