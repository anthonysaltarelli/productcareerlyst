import { ColorPalette } from '@/lib/constants/portfolio-palettes';
import { FontCombination } from '@/lib/constants/portfolio-fonts';

// Content Block Types
export type ContentBlockType =
  | 'hero-image'
  | 'title-description'
  | 'text'
  | 'image'
  | 'two-images'
  | 'text-image'
  | 'image-text'
  | 'metrics-grid'
  | 'gallery'
  | 'quote'
  | 'section-header'
  | 'spacer'
  | 'custom';

export interface Metric {
  id: string;
  label: string;
  value: string;
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
  data: {
    // Common properties
    spacing?: 'tight' | 'normal' | 'loose';
    alignment?: 'left' | 'center' | 'right' | 'full-width';
    
    // Text content
    text?: string;
    title?: string;
    description?: string;
    
    // Images
    images?: string[];
    imageLayout?: 'side-by-side' | 'stacked' | 'grid';
    imageAlignment?: 'left' | 'right' | 'center';
    
    // Metrics
    metrics?: Metric[];
    
    // Gallery
    galleryColumns?: 1 | 2 | 3 | 4;
    
    // Quote
    quote?: string;
    attribution?: string;
    
    // Spacer
    height?: 'small' | 'medium' | 'large' | 'xlarge';
    
    // Custom
    customContent?: string;
  };
}

// Page-level content (Case Study, Work, Side Project)
export interface PageContent {
  id: string;
  title: string;
  description: string;
  heroImage: string;
  tags: string[];
  order: number;
  contentBlocks: ContentBlock[];
}

// Section (Work, Case Studies, Side Projects)
export interface PortfolioSection {
  id: string;
  title: string;
  items: PageContent[];
  order: number;
}

// Global portfolio content
export interface PortfolioContent {
  siteTitle: string;
  siteSubtitle: string;
  bio: string;
  sections: PortfolioSection[];
}

// Theme configuration
export interface PortfolioTheme {
  colorPalette: ColorPalette;
  fontCombination: FontCombination;
  spacing?: 'compact' | 'normal' | 'spacious';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
}


