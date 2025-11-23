'use client';

import { useState } from 'react';
import { ColorPalette, PORTFOLIO_COLOR_PALETTES } from '@/lib/constants/portfolio-palettes';
import { FontCombination, PORTFOLIO_FONT_COMBINATIONS } from '@/lib/constants/portfolio-fonts';
import ModernMinimalistPreview from './ModernMinimalistPreview';
import PortfolioEditorControls from './PortfolioEditorControls';

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

interface PortfolioEditorProps {
  initialCaseStudies?: CaseStudy[];
  initialColorPalette?: ColorPalette;
  initialFontCombination?: FontCombination;
  initialSiteTitle?: string;
  initialSiteSubtitle?: string;
  initialBio?: string;
}

export default function PortfolioEditor({
  initialCaseStudies = [],
  initialColorPalette = PORTFOLIO_COLOR_PALETTES[0],
  initialFontCombination = PORTFOLIO_FONT_COMBINATIONS[0],
  initialSiteTitle = 'Product Portfolio',
  initialSiteSubtitle = '',
  initialBio = '',
}: PortfolioEditorProps) {
  const [siteTitle, setSiteTitle] = useState(initialSiteTitle);
  const [siteSubtitle, setSiteSubtitle] = useState(initialSiteSubtitle);
  const [bio, setBio] = useState(initialBio);
  const [colorPalette, setColorPalette] = useState<ColorPalette>(initialColorPalette);
  const [fontCombination, setFontCombination] = useState<FontCombination>(initialFontCombination);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>(initialCaseStudies);
  const [selectedCaseStudyId, setSelectedCaseStudyId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'homepage' | 'case-study-detail'>('homepage');

  const selectedCaseStudy = caseStudies.find((cs) => cs.id === selectedCaseStudyId) || null;

  const handleAddCaseStudy = () => {
    const newCaseStudy: CaseStudy = {
      id: `case-study-${Date.now()}`,
      title: 'New Case Study',
      description: '',
      heroImage: '',
      problemDiscover: '',
      problemDefine: '',
      solutionDevelop: '',
      solutionDeliver: '',
      process: '',
      metrics: [],
      outcomes: '',
      images: [],
      tags: [],
      order: caseStudies.length,
    };
    setCaseStudies([...caseStudies, newCaseStudy]);
    setSelectedCaseStudyId(newCaseStudy.id);
  };

  const handleDeleteCaseStudy = (id: string) => {
    const newCaseStudies = caseStudies.filter((cs) => cs.id !== id);
    setCaseStudies(newCaseStudies);
    if (selectedCaseStudyId === id) {
      setSelectedCaseStudyId(null);
      setCurrentView('homepage');
    }
  };

  const handleMoveCaseStudyUp = (id: string) => {
    const index = caseStudies.findIndex((cs) => cs.id === id);
    if (index > 0) {
      const newCaseStudies = [...caseStudies];
      const temp = newCaseStudies[index].order;
      newCaseStudies[index].order = newCaseStudies[index - 1].order;
      newCaseStudies[index - 1].order = temp;
      setCaseStudies(newCaseStudies);
    }
  };

  const handleMoveCaseStudyDown = (id: string) => {
    const index = caseStudies.findIndex((cs) => cs.id === id);
    if (index < caseStudies.length - 1) {
      const newCaseStudies = [...caseStudies];
      const temp = newCaseStudies[index].order;
      newCaseStudies[index].order = newCaseStudies[index + 1].order;
      newCaseStudies[index + 1].order = temp;
      setCaseStudies(newCaseStudies);
    }
  };

  const handleUpdateCaseStudy = (id: string, updates: Partial<CaseStudy>) => {
    setCaseStudies(
      caseStudies.map((cs) => (cs.id === id ? { ...cs, ...updates } : cs))
    );
  };

  const handleCaseStudyClick = (caseStudyId: string) => {
    setSelectedCaseStudyId(caseStudyId);
    setCurrentView('case-study-detail');
  };

  const handleBackToHomepage = () => {
    setCurrentView('homepage');
  };

  const handleSave = () => {
    console.log('Saving portfolio:', {
      siteTitle,
      colorPalette: colorPalette.id,
      fontCombination: fontCombination.id,
      caseStudies,
    });
    // TODO: Add toast notification
    alert('Portfolio saved! (This is a placeholder - persistence will be added later)');
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
      {/* Editor Controls Side - Left, 30% on desktop, full width on mobile */}
      <div className="w-full md:w-[30%] flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200">
        <PortfolioEditorControls
          siteTitle={siteTitle}
          onSiteTitleChange={setSiteTitle}
          siteSubtitle={siteSubtitle}
          onSiteSubtitleChange={setSiteSubtitle}
          bio={bio}
          onBioChange={setBio}
          colorPalette={colorPalette}
          onColorPaletteChange={setColorPalette}
          fontCombination={fontCombination}
          onFontCombinationChange={setFontCombination}
          caseStudies={caseStudies}
          selectedCaseStudyId={selectedCaseStudyId}
          onSelectCaseStudy={setSelectedCaseStudyId}
          onAddCaseStudy={handleAddCaseStudy}
          onDeleteCaseStudy={handleDeleteCaseStudy}
          onMoveCaseStudyUp={handleMoveCaseStudyUp}
          onMoveCaseStudyDown={handleMoveCaseStudyDown}
          onUpdateCaseStudy={handleUpdateCaseStudy}
          onSave={handleSave}
        />
      </div>

      {/* Preview Side - Right, 70% on desktop, full width on mobile */}
      <div className="flex-1 overflow-y-auto md:w-[70%]">
        <ModernMinimalistPreview
          view={currentView}
          siteTitle={siteTitle}
          siteSubtitle={siteSubtitle}
          bio={bio}
          caseStudies={caseStudies}
          selectedCaseStudy={selectedCaseStudy}
          colorPalette={colorPalette}
          fontCombination={fontCombination}
          onCaseStudyClick={handleCaseStudyClick}
          onBackToHomepage={handleBackToHomepage}
        />
      </div>
    </div>
  );
}

