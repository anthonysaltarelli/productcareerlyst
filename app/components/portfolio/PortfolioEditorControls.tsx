'use client';

import { useState } from 'react';
import { ColorPalette, PORTFOLIO_COLOR_PALETTES } from '@/lib/constants/portfolio-palettes';
import { FontCombination, PORTFOLIO_FONT_COMBINATIONS } from '@/lib/constants/portfolio-fonts';
import { getColorValue } from '@/lib/utils/portfolio-colors';

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
  caseStudies: CaseStudy[];
  selectedCaseStudyId: string | null;
  onSelectCaseStudy: (id: string | null) => void;
  onAddCaseStudy: () => void;
  onDeleteCaseStudy: (id: string) => void;
  onMoveCaseStudyUp: (id: string) => void;
  onMoveCaseStudyDown: (id: string) => void;
  onUpdateCaseStudy: (id: string, updates: Partial<CaseStudy>) => void;
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
  caseStudies,
  selectedCaseStudyId,
  onSelectCaseStudy,
  onAddCaseStudy,
  onDeleteCaseStudy,
  onMoveCaseStudyUp,
  onMoveCaseStudyDown,
  onUpdateCaseStudy,
  onSave,
}: PortfolioEditorControlsProps) {
  const selectedCaseStudy = caseStudies.find((cs) => cs.id === selectedCaseStudyId) || null;
  const sortedCaseStudies = [...caseStudies].sort((a, b) => a.order - b.order);

  const handleAddMetric = (caseStudyId: string) => {
    const newMetric: Metric = {
      id: `metric-${Date.now()}`,
      label: '',
      value: '',
    };
    const caseStudy = caseStudies.find((cs) => cs.id === caseStudyId);
    if (caseStudy) {
      onUpdateCaseStudy(caseStudyId, {
        metrics: [...(caseStudy.metrics || []), newMetric],
      });
    }
  };

  const handleUpdateMetric = (caseStudyId: string, metricId: string, updates: Partial<Metric>) => {
    const caseStudy = caseStudies.find((cs) => cs.id === caseStudyId);
    if (caseStudy) {
      onUpdateCaseStudy(caseStudyId, {
        metrics: (caseStudy.metrics || []).map((m) =>
          m.id === metricId ? { ...m, ...updates } : m
        ),
      });
    }
  };

  const handleDeleteMetric = (caseStudyId: string, metricId: string) => {
    const caseStudy = caseStudies.find((cs) => cs.id === caseStudyId);
    if (caseStudy) {
      onUpdateCaseStudy(caseStudyId, {
        metrics: (caseStudy.metrics || []).filter((m) => m.id !== metricId),
      });
    }
  };

  const handleAddImage = (caseStudyId: string) => {
    const caseStudy = caseStudies.find((cs) => cs.id === caseStudyId);
    if (caseStudy) {
      onUpdateCaseStudy(caseStudyId, {
        images: [...(caseStudy.images || []), ''],
      });
    }
  };

  const handleUpdateImage = (caseStudyId: string, index: number, url: string) => {
    const caseStudy = caseStudies.find((cs) => cs.id === caseStudyId);
    if (caseStudy) {
      const newImages = [...(caseStudy.images || [])];
      newImages[index] = url;
      onUpdateCaseStudy(caseStudyId, { images: newImages });
    }
  };

  const handleDeleteImage = (caseStudyId: string, index: number) => {
    const caseStudy = caseStudies.find((cs) => cs.id === caseStudyId);
    if (caseStudy) {
      const newImages = [...(caseStudy.images || [])];
      newImages.splice(index, 1);
      onUpdateCaseStudy(caseStudyId, { images: newImages });
    }
  };

  const handleUpdateTags = (caseStudyId: string, tagsString: string) => {
    const tags = tagsString.split(',').map((t) => t.trim()).filter(Boolean);
    onUpdateCaseStudy(caseStudyId, { tags });
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
              placeholder="I design for startups of all sizes. When you have a groundbreaking business idea, but nothing anyone can look at or click on, that's where I come in..."
            />
            <p className="text-xs text-gray-500 mt-1">This text will appear below your case studies</p>
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

        {/* Case Studies List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Case Studies</h2>
            <button
              onClick={onAddCaseStudy}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {sortedCaseStudies.map((caseStudy, index) => (
              <div
                key={caseStudy.id}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedCaseStudyId === caseStudy.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => onSelectCaseStudy(caseStudy.id)}
                    className="flex-1 text-left font-medium text-gray-900"
                  >
                    {caseStudy.title || 'Untitled Case Study'}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveCaseStudyUp(caseStudy.id);
                      }}
                      disabled={index === 0}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveCaseStudyDown(caseStudy.id);
                      }}
                      disabled={index === sortedCaseStudies.length - 1}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCaseStudy(caseStudy.id);
                      }}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Case Study Editor */}
        {selectedCaseStudy && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Case Study</h2>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={selectedCaseStudy.title}
                  onChange={(e) => onUpdateCaseStudy(selectedCaseStudy.id, { title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedCaseStudy.description}
                  onChange={(e) => onUpdateCaseStudy(selectedCaseStudy.id, { description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Hero Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
                <input
                  type="text"
                  value={selectedCaseStudy.heroImage}
                  onChange={(e) => onUpdateCaseStudy(selectedCaseStudy.id, { heroImage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>

              {/* Problem Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Problem</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Discover</label>
                    <textarea
                      value={selectedCaseStudy.problemDiscover}
                      onChange={(e) => onUpdateCaseStudy(selectedCaseStudy.id, { problemDiscover: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Define</label>
                    <textarea
                      value={selectedCaseStudy.problemDefine}
                      onChange={(e) => onUpdateCaseStudy(selectedCaseStudy.id, { problemDefine: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Solution Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Solution</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Develop</label>
                    <textarea
                      value={selectedCaseStudy.solutionDevelop}
                      onChange={(e) => onUpdateCaseStudy(selectedCaseStudy.id, { solutionDevelop: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Deliver</label>
                    <textarea
                      value={selectedCaseStudy.solutionDeliver}
                      onChange={(e) => onUpdateCaseStudy(selectedCaseStudy.id, { solutionDeliver: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Process */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Process</label>
                <textarea
                  value={selectedCaseStudy.process}
                  onChange={(e) => onUpdateCaseStudy(selectedCaseStudy.id, { process: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Results */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs text-gray-600">Metrics</label>
                      <button
                        onClick={() => handleAddMetric(selectedCaseStudy.id)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        + Add Metric
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(selectedCaseStudy.metrics || []).map((metric) => (
                        <div key={metric.id} className="flex gap-2">
                          <input
                            type="text"
                            value={metric.label}
                            onChange={(e) => handleUpdateMetric(selectedCaseStudy.id, metric.id, { label: e.target.value })}
                            placeholder="Label"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="text"
                            value={metric.value}
                            onChange={(e) => handleUpdateMetric(selectedCaseStudy.id, metric.id, { value: e.target.value })}
                            placeholder="Value"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleDeleteMetric(selectedCaseStudy.id, metric.id)}
                            className="px-2 text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Outcomes</label>
                    <textarea
                      value={selectedCaseStudy.outcomes}
                      onChange={(e) => onUpdateCaseStudy(selectedCaseStudy.id, { outcomes: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Image Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Image Gallery</label>
                  <button
                    onClick={() => handleAddImage(selectedCaseStudy.id)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    + Add Image
                  </button>
                </div>
                <div className="space-y-2">
                  {(selectedCaseStudy.images || []).map((image, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={image}
                        onChange={(e) => handleUpdateImage(selectedCaseStudy.id, index, e.target.value)}
                        placeholder="Image URL"
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleDeleteImage(selectedCaseStudy.id, index)}
                        className="px-2 text-red-600 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={(selectedCaseStudy.tags || []).join(', ')}
                  onChange={(e) => handleUpdateTags(selectedCaseStudy.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

