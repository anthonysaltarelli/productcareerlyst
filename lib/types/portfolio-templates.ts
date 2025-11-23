import { ReactNode } from 'react';
import { PortfolioContent, PageContent, ContentBlock, PortfolioTheme } from './portfolio-content';

// Template interface that all templates must implement
export interface PortfolioTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  
  // Render homepage with all sections
  renderHomepage: (
    content: PortfolioContent,
    theme: PortfolioTheme,
    onItemClick: (itemId: string) => void
  ) => ReactNode;
  
  // Render detail page for a single item
  renderDetailPage: (
    pageContent: PageContent,
    theme: PortfolioTheme,
    onBack: () => void
  ) => ReactNode;
  
  // Render individual content blocks (template-specific styling)
  renderBlock: (
    block: ContentBlock,
    theme: PortfolioTheme
  ) => ReactNode;
  
  // Template-specific theme options
  themeOptions?: {
    spacing?: boolean;
    borderRadius?: boolean;
    customColors?: boolean;
  };
}

// Template registry type
export type TemplateRegistry = Record<string, PortfolioTemplate>;

