'use client';

/**
 * Portfolio Editor - Template Selection Page
 * 
 * This page is being re-architected to use TipTap's Notion-like editor.
 * See: https://tiptap.dev/docs/ui-components/templates/notion-like-editor
 * 
 * New architecture will support:
 * - Collections of pages (Work, Case Studies, Side Projects, custom sections)
 * - Each page assigned to a collection/category
 * - Title, cover photo, short description, and tags for each page
 * - TipTap Notion-style editor for main content
 * - Retained profile features (name, social links, profile picture, subtitle, bio)
 */

export default function PortfolioEditorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-2xl text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
          <span className="text-4xl">🚧</span>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-800">
          Portfolio Editor Coming Soon
        </h1>
        <p className="mb-6 text-lg text-gray-600">
          We're rebuilding the portfolio editor with a brand new Notion-like editing experience. 
          Stay tuned for an improved way to create and showcase your product case studies.
        </p>
        <a
          href="/dashboard/portfolio"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:from-purple-600 hover:to-pink-600"
        >
          ← Back to Portfolio
        </a>
      </div>
    </div>
  );
}
