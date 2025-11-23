'use client';

import { ColorPalette } from '@/lib/constants/portfolio-palettes';
import { FontCombination } from '@/lib/constants/portfolio-fonts';
import { PageContent, PortfolioSection } from '@/lib/types/portfolio-content';
import ModernMinimalistHomepage from './ModernMinimalistHomepage';
import CaseStudyDetailPreview from './CaseStudyDetailPreview';

interface ModernMinimalistPreviewProps {
  view: 'homepage' | 'case-study-detail';
  siteTitle: string;
  siteSubtitle: string;
  bio: string;
  sections: PortfolioSection[];
  selectedItem: PageContent | null;
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
    // Extract data from content blocks for legacy CaseStudyDetailPreview
    // Find relevant blocks
    const heroBlock = selectedItem.contentBlocks.find(b => b.type === 'hero-image');
    const titleBlock = selectedItem.contentBlocks.find(b => b.type === 'title-description');
    const problemBlocks = selectedItem.contentBlocks.filter(b => b.data.title?.toLowerCase().includes('problem') || b.data.title?.toLowerCase().includes('discover') || b.data.title?.toLowerCase().includes('define'));
    const solutionBlocks = selectedItem.contentBlocks.filter(b => b.data.title?.toLowerCase().includes('solution') || b.data.title?.toLowerCase().includes('develop') || b.data.title?.toLowerCase().includes('deliver'));
    const processBlock = selectedItem.contentBlocks.find(b => b.data.title?.toLowerCase().includes('process'));
    const resultsBlock = selectedItem.contentBlocks.find(b => b.data.title?.toLowerCase().includes('results'));
    const metricsBlock = selectedItem.contentBlocks.find(b => b.type === 'metrics-grid');
    const galleryBlock = selectedItem.contentBlocks.find(b => b.type === 'gallery');
    
    // Convert PageContent to CaseStudy format for detail view
    const caseStudy = {
      id: selectedItem.id,
      title: selectedItem.title,
      description: selectedItem.description,
      heroImage: selectedItem.heroImage || heroBlock?.data.images?.[0] || '',
      problemDiscover: problemBlocks.find(b => b.data.title?.toLowerCase().includes('discover'))?.data.text || '',
      problemDefine: problemBlocks.find(b => b.data.title?.toLowerCase().includes('define'))?.data.text || '',
      solutionDevelop: solutionBlocks.find(b => b.data.title?.toLowerCase().includes('develop'))?.data.text || '',
      solutionDeliver: solutionBlocks.find(b => b.data.title?.toLowerCase().includes('deliver'))?.data.text || '',
      process: processBlock?.data.text || '',
      metrics: metricsBlock?.data.metrics || [],
      outcomes: resultsBlock?.data.text || '',
      images: galleryBlock?.data.images || [],
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

