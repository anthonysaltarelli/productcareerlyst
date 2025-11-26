'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Eye, EyeOff, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { MobileDashboardHeader } from '@/app/components/MobileDashboardHeader';
import { PortfolioPage } from '@/lib/types/portfolio';

interface PageProps {
  params: Promise<{ templateId: string }>;
}

/**
 * Portfolio Page Editor
 * 
 * This page will eventually integrate TipTap's Notion-like editor.
 * For now, it shows a placeholder with page metadata.
 * 
 * See: https://tiptap.dev/docs/ui-components/templates/notion-like-editor
 */

export default function PortfolioPageEditorPage({ params }: PageProps) {
  const { templateId: pageId } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<PortfolioPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
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
                <div>
                  <h1 className="font-semibold text-gray-800">{page.title}</h1>
                  <p className="text-sm text-gray-500">
                    {page.is_published ? 'Published' : 'Draft'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

                {/* Settings */}
                <button
                  onClick={() => router.push('/dashboard/portfolio/editor')}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
                  type="button"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Settings</span>
                </button>

                {/* Save */}
                <button
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
                  type="button"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden md:inline">Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Editor Placeholder */}
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12">
            <div className="text-center">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 text-4xl">
                ✏️
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-800">
                TipTap Editor Coming Soon
              </h2>
              <p className="mb-6 text-gray-600">
                This is where the Notion-like TipTap editor will be integrated.
                You'll be able to create rich content with blocks, images, and more.
              </p>

              {/* Page Info Preview */}
              <div className="mx-auto max-w-md rounded-xl bg-gray-50 p-6 text-left">
                <h3 className="mb-4 font-semibold text-gray-800">Page Details</h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">Title</dt>
                    <dd className="text-gray-800">{page.title}</dd>
                  </div>
                  {page.description && (
                    <div>
                      <dt className="font-medium text-gray-500">Description</dt>
                      <dd className="text-gray-800">{page.description}</dd>
                    </div>
                  )}
                  {page.tags.length > 0 && (
                    <div>
                      <dt className="mb-1 font-medium text-gray-500">Tags</dt>
                      <dd className="flex flex-wrap gap-1">
                        {page.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-medium text-gray-500">Status</dt>
                    <dd>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          page.is_published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {page.is_published ? 'Published' : 'Draft'}
                      </span>
                    </dd>
                  </div>
                  {page.is_featured && (
                    <div>
                      <dt className="font-medium text-gray-500">Featured</dt>
                      <dd>
                        <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          Yes
                        </span>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="mt-8">
                <a
                  href="https://tiptap.dev/docs/ui-components/templates/notion-like-editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Learn more about TipTap Notion-like Editor →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
