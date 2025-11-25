import { ContentBlock, ContentBlockType } from '@/lib/types/portfolio-content';

// Create a new content block with default values
export const createContentBlock = (
  type: ContentBlockType,
  order: number,
  data?: Partial<ContentBlock['data']>
): ContentBlock => {
  const baseBlock: ContentBlock = {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    order,
    data: {
      spacing: 'normal',
      alignment: 'left',
      ...data,
    },
  };

  // Set type-specific defaults
  switch (type) {
    case 'hero-image':
      return {
        ...baseBlock,
        data: {
          ...baseBlock.data,
          images: data?.images || [],
          alignment: 'full-width',
        },
      };
    case 'title-description':
      return {
        ...baseBlock,
        data: {
          ...baseBlock.data,
          title: data?.title || '',
          description: data?.description || '',
        },
      };
    case 'text':
      return {
        ...baseBlock,
        data: {
          ...baseBlock.data,
          text: data?.text || '',
        },
      };
    case 'image':
      return {
        ...baseBlock,
        data: {
          ...baseBlock.data,
          images: data?.images || [],
        },
      };
    case 'two-images':
      return {
        ...baseBlock,
        data: {
          ...baseBlock.data,
          images: data?.images || [],
          imageLayout: 'side-by-side',
        },
      };
    case 'text-image':
    case 'image-text':
      return {
        ...baseBlock,
        data: {
          ...baseBlock.data,
          text: data?.text || '',
          images: data?.images || [],
          imageAlignment: 'right',
        },
      };
    case 'metrics-grid':
      return {
        ...baseBlock,
        data: {
          ...baseBlock.data,
          metrics: data?.metrics || [],
        },
      };
    case 'gallery':
      return {
        ...baseBlock,
        data: {
          ...baseBlock.data,
          images: data?.images || [],
          galleryColumns: 2,
        },
      };
    case 'quote':
      return {
        ...baseBlock,
        data: {
          ...baseBlock.data,
          quote: data?.quote || '',
          attribution: data?.attribution || '',
        },
      };
    case 'section-header':
      return {
        ...baseBlock,
        data: {
          ...baseBlock.data,
          title: data?.title || '',
        },
      };
    case 'spacer':
      return {
        ...baseBlock,
        data: {
          ...baseBlock.data,
          height: 'medium',
        },
      };
    default:
      return baseBlock;
  }
};

// Get spacing classes based on spacing value
export const getSpacingClasses = (spacing?: 'tight' | 'normal' | 'loose'): string => {
  switch (spacing) {
    case 'tight':
      return 'py-4';
    case 'loose':
      return 'py-12';
    case 'normal':
    default:
      return 'py-6';
  }
};

// Get alignment classes
export const getAlignmentClasses = (alignment?: 'left' | 'center' | 'right' | 'full-width'): string => {
  switch (alignment) {
    case 'center':
      return 'text-center mx-auto';
    case 'right':
      return 'text-right ml-auto';
    case 'full-width':
      return 'w-full';
    case 'left':
    default:
      return 'text-left';
  }
};

// Get spacer height classes
export const getSpacerHeight = (height?: 'small' | 'medium' | 'large' | 'xlarge'): string => {
  switch (height) {
    case 'small':
      return 'h-8';
    case 'large':
      return 'h-24';
    case 'xlarge':
      return 'h-32';
    case 'medium':
    default:
      return 'h-16';
  }
};




