'use client';

import { ColorPalette } from '@/lib/constants/portfolio-palettes';
import { FontCombination } from '@/lib/constants/portfolio-fonts';
import ModernMinimalistHomepage from './ModernMinimalistHomepage';
import CaseStudyDetailPreview from './CaseStudyDetailPreview';

interface Metric {
  id: string;
  label: string;
  value: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  heroImage: string;
  tags: string[];
  order: number;
  // Full case study details (for detail view)
  problemDiscover?: string;
  problemDefine?: string;
  solutionDevelop?: string;
  solutionDeliver?: string;
  process?: string;
  metrics?: Metric[];
  outcomes?: string;
  images?: string[];
}

interface PortfolioSection {
  id: string;
  title: string;
  items: PortfolioItem[];
  order: number;
}

interface ModernMinimalistPreviewProps {
  view: 'homepage' | 'case-study-detail';
  siteTitle: string;
  siteSubtitle: string;
  bio: string;
  sections: PortfolioSection[];
  selectedItem: PortfolioItem | null;
  colorPalette: ColorPalette;
  fontCombination: FontCombination;
  onItemClick: (itemId: string) => void;
  onBackToHomepage: () => void;
}

export default function ModernMinimalistPreview({
  view,
  siteTitle,
  siteSubtitle,
  bio,
  sections,
  selectedItem,
  colorPalette,
  fontCombination,
  onItemClick,
  onBackToHomepage,
}: ModernMinimalistPreviewProps) {
  if (view === 'case-study-detail' && selectedItem) {
    // Convert PortfolioItem to CaseStudy format for detail view
    const caseStudy = {
      id: selectedItem.id,
      title: selectedItem.title,
      description: selectedItem.description,
      heroImage: selectedItem.heroImage,
      problemDiscover: selectedItem.problemDiscover || '',
      problemDefine: selectedItem.problemDefine || '',
      solutionDevelop: selectedItem.solutionDevelop || '',
      solutionDeliver: selectedItem.solutionDeliver || '',
      process: selectedItem.process || '',
      metrics: selectedItem.metrics || [],
      outcomes: selectedItem.outcomes || '',
      images: selectedItem.images || [],
      tags: selectedItem.tags || [],
    };
    
    return (
      <CaseStudyDetailPreview
        caseStudy={caseStudy}
        colorPalette={colorPalette}
        fontCombination={fontCombination}
        onBack={onBackToHomepage}
      />
    );
  }

  return (
    <ModernMinimalistHomepage
      siteTitle={siteTitle}
      siteSubtitle={siteSubtitle}
      bio={bio}
      sections={sections}
      colorPalette={colorPalette}
      fontCombination={fontCombination}
      onItemClick={onItemClick}
    />
  );
}

