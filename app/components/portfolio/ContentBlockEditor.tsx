'use client';

import { useState } from 'react';
import { ContentBlock, ContentBlockType, Metric } from '@/lib/types/portfolio-content';
import { createContentBlock } from '@/lib/utils/content-blocks';

interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onBlocksChange: (blocks: ContentBlock[]) => void;
}

const BLOCK_TYPE_OPTIONS: Array<{ value: ContentBlockType; label: string; icon: string }> = [
  { value: 'hero-image', label: 'Hero Image', icon: '🖼️' },
  { value: 'title-description', label: 'Title & Description', icon: '📝' },
  { value: 'text', label: 'Text', icon: '📄' },
  { value: 'image', label: 'Image', icon: '🖼️' },
  { value: 'two-images', label: 'Two Images', icon: '🖼️🖼️' },
  { value: 'text-image', label: 'Text + Image', icon: '📝🖼️' },
  { value: 'image-text', label: 'Image + Text', icon: '🖼️📝' },
  { value: 'metrics-grid', label: 'Metrics Grid', icon: '📊' },
  { value: 'gallery', label: 'Gallery', icon: '🖼️🖼️🖼️' },
  { value: 'quote', label: 'Quote', icon: '💬' },
  { value: 'section-header', label: 'Section Header', icon: '📑' },
  { value: 'spacer', label: 'Spacer', icon: '↕️' },
];

export default function ContentBlockEditor({ blocks, onBlocksChange }: ContentBlockEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  const handleAddBlock = (type: ContentBlockType) => {
    const newBlock = createContentBlock(type, blocks.length);
    onBlocksChange([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setShowAddMenu(false);
  };

  const handleDeleteBlock = (blockId: string) => {
    const newBlocks = blocks.filter((b) => b.id !== blockId).map((b, idx) => ({
      ...b,
      order: idx,
    }));
    onBlocksChange(newBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleMoveBlockUp = (blockId: string) => {
    const index = sortedBlocks.findIndex((b) => b.id === blockId);
    if (index > 0) {
      const newBlocks = [...blocks];
      const temp = newBlocks.find((b) => b.id === blockId)!.order;
      newBlocks.find((b) => b.id === blockId)!.order = newBlocks.find((b) => b.id === sortedBlocks[index - 1].id)!.order;
      newBlocks.find((b) => b.id === sortedBlocks[index - 1].id)!.order = temp;
      onBlocksChange(newBlocks);
    }
  };

  const handleMoveBlockDown = (blockId: string) => {
    const index = sortedBlocks.findIndex((b) => b.id === blockId);
    if (index < sortedBlocks.length - 1) {
      const newBlocks = [...blocks];
      const temp = newBlocks.find((b) => b.id === blockId)!.order;
      newBlocks.find((b) => b.id === blockId)!.order = newBlocks.find((b) => b.id === sortedBlocks[index + 1].id)!.order;
      newBlocks.find((b) => b.id === sortedBlocks[index + 1].id)!.order = temp;
      onBlocksChange(newBlocks);
    }
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<ContentBlock['data']>) => {
    onBlocksChange(
      blocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              data: {
                ...b.data,
                ...updates,
              },
            }
          : b
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Content Blocks</h3>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            + Add Block
          </button>
          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                  {BLOCK_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAddBlock(option.value)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Block List */}
      <div className="space-y-2">
        {sortedBlocks.map((block, index) => {
          const option = BLOCK_TYPE_OPTIONS.find((o) => o.value === block.type);
          return (
            <div
              key={block.id}
              className={`p-2 border-2 rounded-lg cursor-pointer transition-all ${
                selectedBlockId === block.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => setSelectedBlockId(block.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{option?.icon || '📦'}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {option?.label || block.type}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveBlockUp(block.id);
                    }}
                    disabled={index === 0}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveBlockDown(block.id);
                    }}
                    disabled={index === sortedBlocks.length - 1}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  >
                    ↓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBlock(block.id);
                    }}
                    className="p-1 text-red-600 hover:text-red-700 text-xs"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {sortedBlocks.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">
            No blocks yet. Click "+ Add Block" to add one.
          </p>
        )}
      </div>

      {/* Block Editor */}
      {selectedBlock && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
          <BlockDataEditor block={selectedBlock} onUpdate={(updates) => handleUpdateBlock(selectedBlock.id, updates)} />
        </div>
      )}
    </div>
  );
}

// Block Data Editor Component
function BlockDataEditor({
  block,
  onUpdate,
}: {
  block: ContentBlock;
  onUpdate: (updates: Partial<ContentBlock['data']>) => void;
}) {
  const handleAddMetric = () => {
    const newMetric: Metric = {
      id: `metric-${Date.now()}`,
      label: '',
      value: '',
    };
    onUpdate({
      metrics: [...(block.data.metrics || []), newMetric],
    });
  };

  const handleUpdateMetric = (metricId: string, updates: Partial<Metric>) => {
    onUpdate({
      metrics: (block.data.metrics || []).map((m) =>
        m.id === metricId ? { ...m, ...updates } : m
      ),
    });
  };

  const handleDeleteMetric = (metricId: string) => {
    onUpdate({
      metrics: (block.data.metrics || []).filter((m) => m.id !== metricId),
    });
  };

  const handleAddImage = () => {
    onUpdate({
      images: [...(block.data.images || []), ''],
    });
  };

  const handleUpdateImage = (index: number, url: string) => {
    const newImages = [...(block.data.images || [])];
    newImages[index] = url;
    onUpdate({ images: newImages });
  };

  const handleDeleteImage = (index: number) => {
    const newImages = [...(block.data.images || [])];
    newImages.splice(index, 1);
    onUpdate({ images: newImages });
  };

  return (
    <div className="space-y-3">
      {/* Common Properties */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Spacing</label>
        <select
          value={block.data.spacing || 'normal'}
          onChange={(e) => onUpdate({ spacing: e.target.value as 'tight' | 'normal' | 'loose' })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="tight">Tight</option>
          <option value="normal">Normal</option>
          <option value="loose">Loose</option>
        </select>
      </div>

      {/* Type-specific fields */}
      {block.type === 'title-description' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={block.data.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={block.data.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={3}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
        </>
      )}

      {block.type === 'text' && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
          <textarea
            value={block.data.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            rows={4}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          />
        </div>
      )}

      {(block.type === 'image' || block.type === 'hero-image') && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-700">Image URL</label>
            {block.type === 'image' && (
              <button
                onClick={handleAddImage}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                + Add
              </button>
            )}
          </div>
          {(block.data.images || []).map((img, idx) => (
            <div key={idx} className="flex gap-1 mb-1">
              <input
                type="text"
                value={img}
                onChange={(e) => handleUpdateImage(idx, e.target.value)}
                placeholder="https://..."
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              />
              {block.type === 'image' && (
                <button
                  onClick={() => handleDeleteImage(idx)}
                  className="px-2 text-red-600 hover:text-red-700 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {(!block.data.images || block.data.images.length === 0) && (
            <button
              onClick={handleAddImage}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
            >
              + Add Image URL
            </button>
          )}
        </div>
      )}

      {(block.type === 'two-images' || block.type === 'gallery') && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-700">Images</label>
            <button
              onClick={handleAddImage}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              + Add
            </button>
          </div>
          {(block.data.images || []).map((img, idx) => (
            <div key={idx} className="flex gap-1 mb-1">
              <input
                type="text"
                value={img}
                onChange={(e) => handleUpdateImage(idx, e.target.value)}
                placeholder="https://..."
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              />
              <button
                onClick={() => handleDeleteImage(idx)}
                className="px-2 text-red-600 hover:text-red-700 text-xs"
              >
                ×
              </button>
            </div>
          ))}
          {(!block.data.images || block.data.images.length === 0) && (
            <button
              onClick={handleAddImage}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
            >
              + Add Image URL
            </button>
          )}
          {block.type === 'gallery' && (
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Columns</label>
              <select
                value={block.data.galleryColumns || 2}
                onChange={(e) => onUpdate({ galleryColumns: parseInt(e.target.value) as 1 | 2 | 3 | 4 })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
          )}
        </div>
      )}

      {(block.type === 'text-image' || block.type === 'image-text') && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
            <textarea
              value={block.data.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              rows={4}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="text"
              value={block.data.images?.[0] || ''}
              onChange={(e) => onUpdate({ images: [e.target.value] })}
              placeholder="https://..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
        </>
      )}

      {block.type === 'metrics-grid' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-700">Metrics</label>
            <button
              onClick={handleAddMetric}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {(block.data.metrics || []).map((metric) => (
              <div key={metric.id} className="flex gap-1">
                <input
                  type="text"
                  value={metric.label}
                  onChange={(e) => handleUpdateMetric(metric.id, { label: e.target.value })}
                  placeholder="Label"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={metric.value}
                  onChange={(e) => handleUpdateMetric(metric.id, { value: e.target.value })}
                  placeholder="Value"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                />
                <button
                  onClick={() => handleDeleteMetric(metric.id)}
                  className="px-2 text-red-600 hover:text-red-700 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {block.type === 'quote' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Quote</label>
            <textarea
              value={block.data.quote || ''}
              onChange={(e) => onUpdate({ quote: e.target.value })}
              rows={3}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Attribution</label>
            <input
              type="text"
              value={block.data.attribution || ''}
              onChange={(e) => onUpdate({ attribution: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
        </>
      )}

      {block.type === 'section-header' && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={block.data.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          />
        </div>
      )}

      {block.type === 'spacer' && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
          <select
            value={block.data.height || 'medium'}
            onChange={(e) => onUpdate({ height: e.target.value as 'small' | 'medium' | 'large' | 'xlarge' })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra Large</option>
          </select>
        </div>
      )}
    </div>
  );
}

