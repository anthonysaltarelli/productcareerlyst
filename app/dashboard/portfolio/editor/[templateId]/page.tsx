'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2, 
  Eye, 
  EyeOff, 
  Settings, 
  ExternalLink,
  Image as ImageIcon,
  Tag,
  X,
  Check,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';
import { NotionEditor } from '@/components/tiptap-templates/notion-like/notion-like-editor';
import { PortfolioPage } from '@/lib/types/portfolio';

interface PageProps {
  params: Promise<{ templateId: string }>;
}

/**
 * Portfolio Page Editor
 * 
 * Full-featured page editor with TipTap Notion-like editor,
 * cover image, tags, and metadata management.
 */

export default function PortfolioPageEditorPage({ params }: PageProps) {
  const { templateId: pageId } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<PortfolioPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Metadata editing states
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [tempCoverImage, setTempCoverImage] = useState('');
  const [tempTags, setTempTags] = useState('');

  // Fetch page data
  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await fetch(`/api/portfolio/pages/${pageId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Page not found');
          } else {
            throw new Error('Failed to fetch page');
          }
          return;
        }
        const data = await response.json();
        setPage(data.page);
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('Failed to load page');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [pageId]);


  // Note: Content is now saved automatically via TipTap Cloud collaboration
  // The room ID (portfolio-page-{pageId}) ensures each page has its own document

  const handlePublishToggle = async () => {
    if (!page) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/portfolio/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !page.is_published }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setPage((prev) => prev ? { ...prev, is_published: !prev.is_published } : null);
      toast.success(page.is_published ? 'Page unpublished' : 'Page published!');
    } catch (err) {
      console.error('Error toggling publish:', err);
      toast.error('Failed to update publish status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMetadata = async (field: string, value: string | string[] | null) => {
    if (!page) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/portfolio/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setPage((prev) => prev ? { ...prev, [field]: value } : null);
      toast.success('Updated!');
      setEditingField(null);
    } catch (err) {
      console.error('Error updating metadata:', err);
      toast.error('Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditField = (field: string) => {
    if (!page) return;
    
    setEditingField(field);
    switch (field) {
      case 'title':
        setTempTitle(page.title);
        break;
      case 'description':
        setTempDescription(page.description || '');
        break;
      case 'cover_image_url':
        setTempCoverImage(page.cover_image_url || '');
        break;
      case 'tags':
        setTempTags(page.tags.join(', '));
        break;
    }
  };

  const handleSaveField = (field: string) => {
    switch (field) {
      case 'title':
        if (tempTitle.trim()) {
          handleUpdateMetadata('title', tempTitle.trim());
        }
        break;
      case 'description':
        handleUpdateMetadata('description', tempDescription.trim() || null);
        break;
      case 'cover_image_url':
        handleUpdateMetadata('cover_image_url', tempCoverImage.trim() || null);
        break;
      case 'tags':
        const tagsArray = tempTags.split(',').map((t) => t.trim()).filter(Boolean);
        handleUpdateMetadata('tags', tagsArray);
        break;
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveField(field);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Error state
  if (error || !page) {
    return (
      <>
        <MobileDashboardHeader title="Page Editor" />
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-8">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 text-4xl">
            ❌
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">
            {error || 'Page not found'}
          </h1>
          <p className="mb-6 text-gray-600">
            The page you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => router.push('/dashboard/portfolio/editor')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
            type="button"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Portfolio Manager
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileDashboardHeader title={page.title} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-16 md:pt-0">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-3 md:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard/portfolio/editor')}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden md:inline">Back</span>
                </button>
                <div className="h-6 w-px bg-gray-200" />
                <div className="min-w-0">
                  <h1 className="truncate font-semibold text-gray-800">{page.title}</h1>
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    {page.is_published ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Eye className="h-3 w-3" />
                        Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Draft
                      </span>
                    )}
                    <span className="text-green-600">• Auto-saved</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Settings Toggle */}
                <button
                  onClick={() => setShowMetadataEditor(!showMetadataEditor)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    showMetadataEditor
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Details</span>
                </button>

                {/* Publish Toggle */}
                <button
                  onClick={handlePublishToggle}
                  disabled={isSaving}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    page.is_published
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50`}
                  type="button"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : page.is_published ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  <span className="hidden md:inline">
                    {page.is_published ? 'Published' : 'Draft'}
                  </span>
                </button>

                {/* Preview */}
                {page.is_published && (
                  <a
                    href={`/p/${page.slug || page.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden md:inline">Preview</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Editor Panel */}
            <div className="flex-1">
              {/* Cover Image Header */}
              {page.cover_image_url ? (
                <div className="group relative mb-6 overflow-hidden rounded-2xl">
                  <img
                    src={page.cover_image_url}
                    alt={page.title}
                    className="h-48 w-full object-cover md:h-64"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-2xl font-bold text-white md:text-3xl">{page.title}</h2>
                    {page.description && (
                      <p className="mt-2 text-white/80">{page.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleStartEditField('cover_image_url')}
                    className="absolute right-4 top-4 rounded-lg bg-white/90 p-2 opacity-0 transition-opacity group-hover:opacity-100"
                    type="button"
                    aria-label="Change cover image"
                  >
                    <Pencil className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartEditField('cover_image_url')}
                  className="mb-6 flex h-32 w-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors hover:border-purple-400 hover:text-purple-500"
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    <span>Add cover image</span>
                  </div>
                </button>
              )}

              {/* Tags */}
              {page.tags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {page.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* TipTap Editor - Uses TipTap Cloud for real-time collaboration */}
              <NotionEditor
                room={`portfolio-page-${page.id}`}
                placeholder="Start writing your case study..."
              />
            </div>

            {/* Metadata Sidebar */}
            {showMetadataEditor && (
              <div className="w-full lg:w-80">
                <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-gray-800">Page Details</h3>

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      {editingField === 'title' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'title')}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveField('title')}
                            className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                            type="button"
                            aria-label="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                            type="button"
                            aria-label="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditField('title')}
                          className="group flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:border-purple-300"
                          type="button"
                        >
                          <span className="truncate">{page.title}</span>
                          <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      {editingField === 'description' ? (
                        <div className="space-y-2">
                          <textarea
                            value={tempDescription}
                            onChange={(e) => setTempDescription(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={handleCancelEdit}
                              className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                              type="button"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveField('description')}
                              className="rounded-lg bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700"
                              type="button"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditField('description')}
                          className="group flex w-full items-start justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:border-purple-300"
                          type="button"
                        >
                          <span className={page.description ? 'text-gray-700' : 'text-gray-400 italic'}>
                            {page.description || 'Add a description...'}
                          </span>
                          <Pencil className="ml-2 mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </div>

                    {/* Cover Image */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Cover Image URL
                      </label>
                      {editingField === 'cover_image_url' ? (
                        <div className="space-y-2">
                          <input
                            type="url"
                            value={tempCoverImage}
                            onChange={(e) => setTempCoverImage(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'cover_image_url')}
                            placeholder="https://example.com/image.jpg"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={handleCancelEdit}
                              className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                              type="button"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveField('cover_image_url')}
                              className="rounded-lg bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700"
                              type="button"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditField('cover_image_url')}
                          className="group flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:border-purple-300"
                          type="button"
                        >
                          <span className={page.cover_image_url ? 'truncate text-gray-700' : 'text-gray-400 italic'}>
                            {page.cover_image_url || 'Add cover image...'}
                          </span>
                          <ImageIcon className="ml-2 h-3 w-3 flex-shrink-0 text-gray-400 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Tags
                      </label>
                      {editingField === 'tags' ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={tempTags}
                            onChange={(e) => setTempTags(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'tags')}
                            placeholder="Design, UX, Mobile (comma-separated)"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={handleCancelEdit}
                              className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                              type="button"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveField('tags')}
                              className="rounded-lg bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700"
                              type="button"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditField('tags')}
                          className="group flex w-full items-start justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:border-purple-300"
                          type="button"
                        >
                          {page.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {page.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Add tags...</span>
                          )}
                          <Tag className="ml-2 mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            page.is_published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {page.is_published ? 'Published' : 'Draft'}
                        </span>
                        {page.is_featured && (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="space-y-2 text-xs text-gray-500">
                        <p>
                          Created: {new Date(page.created_at).toLocaleDateString()}
                        </p>
                        <p>
                          Updated: {new Date(page.updated_at).toLocaleDateString()}
                        </p>
                        {page.published_at && (
                          <p>
                            Published: {new Date(page.published_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
