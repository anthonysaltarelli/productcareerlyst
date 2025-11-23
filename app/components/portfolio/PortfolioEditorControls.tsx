'use client';

import { ColorPalette, PORTFOLIO_COLOR_PALETTES } from '@/lib/constants/portfolio-palettes';
import { FontCombination, PORTFOLIO_FONT_COMBINATIONS } from '@/lib/constants/portfolio-fonts';
import { PORTFOLIO_TEMPLATES } from '@/lib/constants/portfolio-templates';
import { getColorValue } from '@/lib/utils/portfolio-colors';
import { PageContent, PortfolioSection } from '@/lib/types/portfolio-content';
import ContentBlockEditor from './ContentBlockEditor';

interface PortfolioEditorControlsProps {
  siteTitle: string;
  onSiteTitleChange: (title: string) => void;
  siteSubtitle: string;
  onSiteSubtitleChange: (subtitle: string) => void;
  bio: string;
  onBioChange: (bio: string) => void;
  colorPalette: ColorPalette;
  onColorPaletteChange: (palette: ColorPalette) => void;
  fontCombination: FontCombination;
  onFontCombinationChange: (font: FontCombination) => void;
  templateId: string;
  onTemplateChange: (templateId: string) => void;
  sections: PortfolioSection[];
  selectedSectionId: string | null;
  selectedItemId: string | null;
  onSelectSection: (sectionId: string | null) => void;
  onSelectItem: (sectionId: string, itemId: string) => void;
  onAddItem: (sectionId: string) => void;
  onDeleteItem: (sectionId: string, itemId: string) => void;
  onMoveItemUp: (sectionId: string, itemId: string) => void;
  onMoveItemDown: (sectionId: string, itemId: string) => void;
  onUpdateItem: (sectionId: string, itemId: string, updates: Partial<PageContent>) => void;
  onSave: () => void;
}

export default function PortfolioEditorControls({
  siteTitle,
  onSiteTitleChange,
  siteSubtitle,
  onSiteSubtitleChange,
  bio,
  onBioChange,
  colorPalette,
  onColorPaletteChange,
  fontCombination,
  onFontCombinationChange,
  templateId,
  onTemplateChange,
  sections,
  selectedSectionId,
  selectedItemId,
  onSelectSection,
  onSelectItem,
  onAddItem,
  onDeleteItem,
  onMoveItemUp,
  onMoveItemDown,
  onUpdateItem,
  onSave,
}: PortfolioEditorControlsProps) {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedItem = selectedSection?.items.find((item) => item.id === selectedItemId) || null;

  const handleUpdateTags = (sectionId: string, itemId: string, tagsString: string) => {
    const tags = tagsString.split(',').map((t) => t.trim()).filter(Boolean);
    onUpdateItem(sectionId, itemId, { tags });
  };

  const handleUpdateBlocks = (sectionId: string, itemId: string, blocks: PageContent['contentBlocks']) => {
    onUpdateItem(sectionId, itemId, { contentBlocks: blocks });
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 border-l border-gray-200">
      <div className="p-6 space-y-8">
        {/* Save Button */}
        <div>
          <button
            onClick={onSave}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Save Portfolio
          </button>
        </div>

        {/* Template Selector */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Template</h2>
          <select
            value={templateId}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {PORTFOLIO_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.icon} {template.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {PORTFOLIO_TEMPLATES.find((t) => t.id === templateId)?.description}
          </p>
        </section>

        {/* Design Settings */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Design Settings</h2>
          
          {/* Site Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Title</label>
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => onSiteTitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Product Portfolio"
            />
          </div>

          {/* Site Subtitle */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Subtitle</label>
            <input
              type="text"
              value={siteSubtitle}
              onChange={(e) => onSiteSubtitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brand & Digital Design for Startups"
            />
          </div>

          {/* Bio Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="I design for startups of all sizes..."
            />
            <p className="text-xs text-gray-500 mt-1">This text will appear below your sections</p>
          </div>

          {/* Color Palette Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Color Palette</label>
            <div className="grid grid-cols-2 gap-3">
              {PORTFOLIO_COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.id}
                  onClick={() => onColorPaletteChange(palette)}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    colorPalette.id === palette.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getColorValue(palette.colors.primary) }}
                    />
                    <span className="text-sm font-medium text-gray-900">{palette.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: getColorValue(palette.colors.primary) }} />
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: getColorValue(palette.colors.secondary) }} />
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: getColorValue(palette.colors.accent) }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Combination Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Font Combination</label>
            <select
              value={fontCombination.id}
              onChange={(e) => {
                const font = PORTFOLIO_FONT_COMBINATIONS.find((f) => f.id === e.target.value);
                if (font) onFontCombinationChange(font);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {PORTFOLIO_FONT_COMBINATIONS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Sections */}
        {sortedSections.map((section) => {
          const sortedItems = [...section.items].sort((a, b) => a.order - b.order);
          const isSectionSelected = selectedSectionId === section.id;
          
          return (
            <section key={section.id}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                <button
                  onClick={() => onAddItem(section.id)}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {sortedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedItemId === item.id && isSectionSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => onSelectItem(section.id, item.id)}
                        className="flex-1 text-left font-medium text-gray-900"
                      >
                        {item.title || 'Untitled Item'}
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveItemUp(section.id, item.id);
                          }}
                          disabled={index === 0}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveItemDown(section.id, item.id);
                          }}
                          disabled={index === sortedItems.length - 1}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(section.id, item.id);
                          }}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {sortedItems.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No items yet. Click "+ Add" to add one.</p>
                )}
              </div>
            </section>
          );
        })}

        {/* Item Editor */}
        {selectedItem && selectedSectionId && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Item</h2>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={selectedItem.title}
                  onChange={(e) => onUpdateItem(selectedSectionId, selectedItem.id, { title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedItem.description}
                  onChange={(e) => onUpdateItem(selectedSectionId, selectedItem.id, { description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Hero Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
                <input
                  type="text"
                  value={selectedItem.heroImage}
                  onChange={(e) => onUpdateItem(selectedSectionId, selectedItem.id, { heroImage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={(selectedItem.tags || []).join(', ')}
                  onChange={(e) => handleUpdateTags(selectedSectionId, selectedItem.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas (2-3 recommended)</p>
              </div>

              {/* Content Blocks Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Blocks</label>
                <ContentBlockEditor
                  blocks={selectedItem.contentBlocks || []}
                  onBlocksChange={(blocks) => handleUpdateBlocks(selectedSectionId, selectedItem.id, blocks)}
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
