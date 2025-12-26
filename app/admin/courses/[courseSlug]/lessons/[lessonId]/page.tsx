'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Save,
  RotateCcw,
  ExternalLink,
  Video,
  Clock,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { JSONContent } from '@tiptap/react';
import {
  NotionEditorStandalone,
  NotionEditorStandaloneRef,
} from '@/components/tiptap-templates/notion-like/notion-like-editor-standalone';

interface Lesson {
  id: string;
  title: string;
  video_url: string | null;
  prioritization: string;
  requires_subscription: boolean;
  duration_minutes: number | null;
  short_description: string | null;
  content: JSONContent | null;
  created_at: string;
  updated_at: string;
  courses: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
  };
}

interface PageProps {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}

export default function AdminLessonEditorPage({ params }: PageProps) {
  const { courseSlug, lessonId } = use(params);
  const router = useRouter();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Content state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialContent, setInitialContent] = useState<JSONContent | undefined>(undefined);

  // Editor ref
  const editorRef = useRef<NotionEditorStandaloneRef>(null);

  // Fetch lesson data
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await fetch(`/api/admin/lessons/${lessonId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Lesson not found');
          } else if (response.status === 403) {
            setError('Access denied. Admin privileges required.');
          } else {
            throw new Error('Failed to fetch lesson');
          }
          return;
        }

        const data = await response.json();
        const lessonData = data.lesson;

        // Handle nested courses data
        lessonData.courses = Array.isArray(lessonData.courses)
          ? lessonData.courses[0]
          : lessonData.courses;

        setLesson(lessonData);

        // Set initial content
        if (lessonData.content && lessonData.content.type === 'doc') {
          setInitialContent(lessonData.content);
        } else {
          setInitialContent({
            type: 'doc',
            content: [{ type: 'paragraph' }],
          });
        }
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError('Failed to load lesson');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  // Handle content save
  const handleSaveContent = useCallback(
    async (content: JSONContent) => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/lessons/${lessonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          throw new Error('Failed to save content');
        }

        setInitialContent(content);
        setHasUnsavedChanges(false);
        toast.success('Content saved!');
      } catch (err) {
        console.error('Error saving content:', err);
        toast.error('Failed to save content');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [lessonId]
  );

  // Handle content discard
  const handleDiscardContent = useCallback(() => {
    setHasUnsavedChanges(false);
    toast.info('Changes discarded');
  }, []);

  // Handle content change tracking
  const handleContentChange = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  }, []);

  // Handle back navigation
  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    router.push('/admin/courses');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Error state
  if (error || !lesson) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 text-4xl">
          ❌
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">
          {error || 'Lesson not found'}
        </h1>
        <button
          onClick={() => router.push('/admin/courses')}
          className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline">Back to Courses</span>
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="min-w-0">
                <h1 className="truncate font-semibold text-gray-800">
                  {lesson.title}
                </h1>
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{lesson.courses.title}</span>
                  <span>•</span>
                  <span>Lesson {lesson.prioritization}</span>
                  {hasUnsavedChanges ? (
                    <span className="text-amber-600">• Unsaved changes</span>
                  ) : (
                    <span className="text-green-600">• Saved</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Save/Discard Buttons */}
              {hasUnsavedChanges && (
                <>
                  <button
                    onClick={() => editorRef.current?.discard()}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    type="button"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden md:inline">Discard</span>
                  </button>
                  <button
                    onClick={() => editorRef.current?.save()}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    type="button"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="hidden md:inline">Save</span>
                  </button>
                </>
              )}

              {/* View Live Lesson */}
              <Link
                href={`/dashboard/courses/${courseSlug}/lessons/${lessonId}`}
                target="_blank"
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden md:inline">View Lesson</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar - Lesson Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-4 font-semibold text-gray-800">Lesson Info</h3>

              <div className="space-y-4 text-sm">
                {/* Lesson ID */}
                <div>
                  <div className="mb-1 text-gray-500">Lesson ID</div>
                  <div className="text-xs text-gray-600 font-mono break-all select-all">
                    {lesson.id}
                  </div>
                </div>

                {/* Video Status */}
                <div>
                  <div className="mb-1 text-gray-500">Video</div>
                  {lesson.video_url ? (
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Video className="h-4 w-4" />
                      <span>Has video</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Video className="h-4 w-4" />
                      <span>No video</span>
                    </div>
                  )}
                </div>

                {/* Duration */}
                {lesson.duration_minutes && (
                  <div>
                    <div className="mb-1 text-gray-500">Duration</div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="h-4 w-4" />
                      <span>{lesson.duration_minutes} min</span>
                    </div>
                  </div>
                )}

                {/* Description */}
                {lesson.short_description && (
                  <div>
                    <div className="mb-1 text-gray-500">Description</div>
                    <p className="text-gray-700">{lesson.short_description}</p>
                  </div>
                )}

                {/* Premium Badge */}
                {lesson.requires_subscription && (
                  <div className="pt-2">
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                      Premium Lesson
                    </span>
                  </div>
                )}

                {/* Dates */}
                <div className="border-t border-gray-100 pt-4 text-xs text-gray-500">
                  <p>Created: {new Date(lesson.created_at).toLocaleDateString()}</p>
                  <p>Updated: {new Date(lesson.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <h2 className="font-semibold text-gray-800">Written Content</h2>
              </div>
              <p className="mb-6 text-sm text-gray-500">
                Add supplementary written content for this lesson. This will appear below the video on the lesson page.
              </p>

              {/* TipTap Editor */}
              {initialContent && (
                <NotionEditorStandalone
                  editorRef={editorRef}
                  initialContent={initialContent}
                  placeholder="Start writing lesson content..."
                  onSave={handleSaveContent}
                  onDiscard={handleDiscardContent}
                  onContentChange={handleContentChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
