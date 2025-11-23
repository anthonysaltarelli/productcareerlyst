'use client';

import { PortfolioTemplate } from '@/lib/types/portfolio-templates';
import { PortfolioContent, PageContent, PortfolioTheme } from '@/lib/types/portfolio-content';

interface TemplatePreviewProps {
  template: PortfolioTemplate;
  content: PortfolioContent;
  theme: PortfolioTheme;
  selectedItem: PageContent | null;
  view: 'homepage' | 'detail';
  onItemClick: (itemId: string) => void;
  onBackToHomepage: () => void;
}

export default function TemplatePreview({
  template,
  content,
  theme,
  selectedItem,
  view,
  onItemClick,
  onBackToHomepage,
}: TemplatePreviewProps) {
  if (view === 'detail' && selectedItem) {
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

