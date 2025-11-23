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

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  heroImage: string;
  problemDiscover: string;
  problemDefine: string;
  solutionDevelop: string;
  solutionDeliver: string;
  process: string;
  metrics: Metric[];
  outcomes: string;
  images: string[];
  tags: string[];
  order: number;
}

interface ModernMinimalistPreviewProps {
  view: 'homepage' | 'case-study-detail';
  siteTitle: string;
  siteSubtitle: string;
  bio: string;
  caseStudies: CaseStudy[];
  selectedCaseStudy: CaseStudy | null;
  colorPalette: ColorPalette;
  fontCombination: FontCombination;
  onCaseStudyClick: (caseStudyId: string) => void;
  onBackToHomepage: () => void;
}

export default function ModernMinimalistPreview({
  view,
  siteTitle,
  siteSubtitle,
  bio,
  caseStudies,
  selectedCaseStudy,
  colorPalette,
  fontCombination,
  onCaseStudyClick,
  onBackToHomepage,
}: ModernMinimalistPreviewProps) {
  if (view === 'case-study-detail') {
    return (
      <CaseStudyDetailPreview
        caseStudy={selectedCaseStudy}
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
      caseStudies={caseStudies}
      colorPalette={colorPalette}
      fontCombination={fontCombination}
      onCaseStudyClick={onCaseStudyClick}
    />
  );
}

