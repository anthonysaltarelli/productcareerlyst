'use client';

import { useState, useEffect } from 'react';
import { ColorPalette, PORTFOLIO_COLOR_PALETTES } from '@/lib/constants/portfolio-palettes';
import { FontCombination, PORTFOLIO_FONT_COMBINATIONS } from '@/lib/constants/portfolio-fonts';
import { PortfolioContent, PageContent, PortfolioSection, PortfolioTheme } from '@/lib/types/portfolio-content';
import { getTemplate, PORTFOLIO_TEMPLATES } from '@/lib/constants/portfolio-templates';
import { migrateLegacyItemToPageContent } from '@/lib/utils/portfolio-migration';
import { createContentBlock } from '@/lib/utils/content-blocks';
import PortfolioEditorControls from './PortfolioEditorControls';
import TemplatePreview from './TemplatePreview';

// Legacy interfaces for migration
interface LegacyPortfolioItem {
  id: string;
  title: string;
  description: string;
  heroImage: string;
  tags: string[];
  order: number;
  problemDiscover?: string;
  problemDefine?: string;
  solutionDevelop?: string;
  solutionDeliver?: string;
  process?: string;
  metrics?: Array<{ id: string; label: string; value: string }>;
  outcomes?: string;
  images?: string[];
}

interface LegacyPortfolioSection {
  id: string;
  title: string;
  items: LegacyPortfolioItem[];
  order: number;
}

interface PortfolioEditorProps {
  initialSections?: PortfolioSection[] | LegacyPortfolioSection[];
  initialColorPalette?: ColorPalette;
  initialFontCombination?: FontCombination;
  initialSiteTitle?: string;
  initialSiteSubtitle?: string;
  initialBio?: string;
  initialTemplateId?: string;
}

const createDefaultSections = (): PortfolioSection[] => [
  {
    id: 'work',
    title: 'Work',
    items: [],
    order: 0,
  },
  {
    id: 'case-studies',
    title: 'Case Studies',
    items: [],
    order: 1,
  },
  {
    id: 'side-projects',
    title: 'Side Projects',
    items: [],
    order: 2,
  },
];

// Migrate legacy sections to new format
const migrateSections = (sections: PortfolioSection[] | LegacyPortfolioSection[]): PortfolioSection[] => {
  // Check if it's legacy format (has items with old structure)
  const firstItem = sections[0]?.items[0];
  if (firstItem && 'problemDiscover' in firstItem) {
    // Legacy format - migrate
    return sections.map((section) => ({
      ...section,
      items: (section.items as LegacyPortfolioItem[]).map((item) =>
        migrateLegacyItemToPageContent(item)
      ),
    })) as PortfolioSection[];
  }
  return sections as PortfolioSection[];
};

export default function PortfolioEditor({
  initialSections,
  initialColorPalette = PORTFOLIO_COLOR_PALETTES[0],
  initialFontCombination = PORTFOLIO_FONT_COMBINATIONS[0],
  initialSiteTitle = 'Product Portfolio',
  initialSiteSubtitle = '',
  initialBio = '',
  initialTemplateId = 'modern-minimalist',
}: PortfolioEditorProps) {
  const [siteTitle, setSiteTitle] = useState(initialSiteTitle);
  const [siteSubtitle, setSiteSubtitle] = useState(initialSiteSubtitle);
  const [bio, setBio] = useState(initialBio);
  const [colorPalette, setColorPalette] = useState<ColorPalette>(initialColorPalette);
  const [fontCombination, setFontCombination] = useState<FontCombination>(initialFontCombination);
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [sections, setSections] = useState<PortfolioSection[]>(() => {
    if (initialSections) {
      return migrateSections(initialSections);
    }
    return createDefaultSections();
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'homepage' | 'detail'>('homepage');

  // Get current template
  const template = getTemplate(templateId) || PORTFOLIO_TEMPLATES[0];

  // Build portfolio content
  const portfolioContent: PortfolioContent = {
    siteTitle,
    siteSubtitle,
    bio,
    sections,
  };

  // Build theme
  const theme: PortfolioTheme = {
    colorPalette,
    fontCombination,
    spacing: 'normal',
    borderRadius: 'medium',
  };

  // Find selected item across all sections
  const selectedItem = sections
    .flatMap((s) => s.items)
    .find((item) => item.id === selectedItemId) || null;

  const handleAddItem = (sectionId: string) => {
    const newItemId = `item-${Date.now()}`;
    const newItem: PageContent = {
      id: newItemId,
      title: 'New Item',
      description: '',
      heroImage: '',
      tags: [],
      order: 0,
      contentBlocks: [
        createContentBlock('hero-image', 0, { images: [] }),
        createContentBlock('title-description', 1, { title: 'New Item', description: '' }),
      ],
    };
    
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          newItem.order = section.items.length;
          return {
            ...section,
            items: [...section.items, newItem],
          };
        }
        return section;
      })
    );
    
    setSelectedSectionId(sectionId);
    setSelectedItemId(newItemId);
    setCurrentView('detail');
  };

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.filter((item) => item.id !== itemId),
          };
        }
        return section;
      })
    );
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
      setSelectedSectionId(null);
      setCurrentView('homepage');
    }
  };

  const handleMoveItemUp = (sectionId: string, itemId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const items = [...section.items];
          const index = items.findIndex((item) => item.id === itemId);
          if (index > 0) {
            const temp = items[index].order;
            items[index].order = items[index - 1].order;
            items[index - 1].order = temp;
            return { ...section, items };
          }
        }
        return section;
      })
    );
  };

  const handleMoveItemDown = (sectionId: string, itemId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const items = [...section.items];
          const index = items.findIndex((item) => item.id === itemId);
          if (index < items.length - 1) {
            const temp = items[index].order;
            items[index].order = items[index + 1].order;
            items[index + 1].order = temp;
            return { ...section, items };
          }
        }
        return section;
      })
    );
  };

  const handleUpdateItem = (sectionId: string, itemId: string, updates: Partial<PageContent>) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
          };
        }
        return section;
      })
    );
  };

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setCurrentView('detail');
  };

  const handleBackToHomepage = () => {
    setCurrentView('homepage');
  };

  const handleSave = () => {
    console.log('Saving portfolio:', {
      siteTitle,
      colorPalette: colorPalette.id,
      fontCombination: fontCombination.id,
      templateId,
      sections,
    });
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
          templateId={templateId}
          onTemplateChange={setTemplateId}
          sections={sections}
          selectedSectionId={selectedSectionId}
          selectedItemId={selectedItemId}
          onSelectSection={setSelectedSectionId}
          onSelectItem={(sectionId, itemId) => {
            setSelectedSectionId(sectionId);
            setSelectedItemId(itemId);
            setCurrentView('detail');
          }}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
          onMoveItemUp={handleMoveItemUp}
          onMoveItemDown={handleMoveItemDown}
          onUpdateItem={handleUpdateItem}
          onSave={handleSave}
        />
      </div>

      {/* Preview Side - Right, 70% on desktop, full width on mobile */}
      <div className="flex-1 overflow-y-auto md:w-[70%]">
        <TemplatePreview
          template={template}
          content={portfolioContent}
          theme={theme}
          selectedItem={selectedItem}
          view={currentView}
          onItemClick={handleItemClick}
          onBackToHomepage={handleBackToHomepage}
        />
      </div>
    </div>
  );
}
