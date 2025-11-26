/**
 * Portfolio Types
 * 
 * Types for the new portfolio system using TipTap Notion-like editor.
 * These correspond to the database tables: portfolios, portfolio_categories, portfolio_pages
 */

// ============================================================================
// Work Experience (Career History)
// ============================================================================

export interface PortfolioWorkExperience {
  company: string;
  company_url?: string;
  title: string;
  is_current: boolean;
  display_order: number;
}

// ============================================================================
// Social Links
// ============================================================================

export interface PortfolioSocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  dribbble?: string;
  behance?: string;
  website?: string;
  email?: string;
  [key: string]: string | undefined; // Allow custom social links
}

// ============================================================================
// Portfolio (Main settings)
// ============================================================================

export interface Portfolio {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  subtitle?: string;
  bio?: string;
  profile_image_url?: string;
  social_links: PortfolioSocialLinks;
  work_experience: PortfolioWorkExperience[];
  is_published: boolean;
  show_resume_download: boolean;
  show_work_experience: boolean;
  resume_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioCreateInput {
  slug: string;
  display_name: string;
  subtitle?: string;
  bio?: string;
  profile_image_url?: string;
  social_links?: PortfolioSocialLinks;
  work_experience?: PortfolioWorkExperience[];
  is_published?: boolean;
  show_resume_download?: boolean;
  show_work_experience?: boolean;
  resume_url?: string;
}

export interface PortfolioUpdateInput {
  slug?: string;
  display_name?: string;
  subtitle?: string;
  bio?: string;
  profile_image_url?: string;
  social_links?: PortfolioSocialLinks;
  work_experience?: PortfolioWorkExperience[];
  is_published?: boolean;
  show_resume_download?: boolean;
  show_work_experience?: boolean;
  resume_url?: string;
}

// ============================================================================
// Portfolio Category (Collections)
// ============================================================================

export interface PortfolioCategory {
  id: string;
  portfolio_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioCategoryCreateInput {
  portfolio_id: string;
  name: string;
  description?: string;
  display_order?: number;
  is_visible?: boolean;
}

export interface PortfolioCategoryUpdateInput {
  name?: string;
  description?: string;
  display_order?: number;
  is_visible?: boolean;
}

// ============================================================================
// Portfolio Page (Case Studies/Projects)
// ============================================================================

export interface PortfolioPage {
  id: string;
  portfolio_id: string;
  category_id?: string;
  title: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  tags: string[];
  content: TipTapContent; // TipTap JSON content
  display_order: number;
  is_published: boolean;
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  // Unsplash attribution fields
  cover_image_source?: 'upload' | 'template' | 'unsplash';
  unsplash_photo_id?: string;
  unsplash_photographer_name?: string;
  unsplash_photographer_username?: string;
  unsplash_download_location?: string;
}

export interface PortfolioPageCreateInput {
  portfolio_id: string;
  category_id?: string;
  title: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  tags?: string[];
  content?: TipTapContent;
  display_order?: number;
  is_published?: boolean;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  // Unsplash attribution fields
  cover_image_source?: 'upload' | 'template' | 'unsplash';
  unsplash_photo_id?: string;
  unsplash_photographer_name?: string;
  unsplash_photographer_username?: string;
  unsplash_download_location?: string;
}

export interface PortfolioPageUpdateInput {
  category_id?: string;
  title?: string;
  slug?: string;
  description?: string;
  cover_image_url?: string;
  tags?: string[];
  content?: TipTapContent;
  display_order?: number;
  is_published?: boolean;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  // Unsplash attribution fields
  cover_image_source?: 'upload' | 'template' | 'unsplash';
  unsplash_photo_id?: string;
  unsplash_photographer_name?: string;
  unsplash_photographer_username?: string;
  unsplash_download_location?: string;
}

// ============================================================================
// TipTap Content
// ============================================================================

// TipTap JSON content structure (simplified)
// The actual content is managed by TipTap editor
export interface TipTapContent {
  type: 'doc';
  content?: TipTapNode[];
}

export interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
}

export interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

// ============================================================================
// Combined Types (for API responses)
// ============================================================================

export interface PortfolioWithCategories extends Portfolio {
  categories: PortfolioCategoryWithPages[];
}

export interface PortfolioCategoryWithPages extends PortfolioCategory {
  pages: PortfolioPage[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PortfolioAPIResponse {
  portfolio: Portfolio;
  categories: PortfolioCategoryWithPages[];
}

export interface SlugAvailabilityResponse {
  available: boolean;
  suggestion?: string;
}

