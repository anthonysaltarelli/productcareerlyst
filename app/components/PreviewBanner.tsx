'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Eye, Pencil, X } from 'lucide-react';

interface PreviewBannerProps {
  editUrl: string;
  portfolioIsPublished?: boolean;
}

/**
 * PreviewBanner Component
 * 
 * Displays a sticky banner at the top of the page when in preview mode.
 * Shows the preview status and provides quick actions to edit or exit preview.
 */
const PreviewBanner = ({ editUrl, portfolioIsPublished = false }: PreviewBannerProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleExitPreview = () => {
    // Remove the preview query parameter by navigating to the same path without it
    // If the portfolio is published, stay on the page; otherwise go to editor
    if (portfolioIsPublished) {
      router.push(pathname);
    } else {
      router.push(editUrl);
    }
  };

  return (
    <div className="sticky top-0 z-50 border-b border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 sm:px-6">
        {/* Left side - Status */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400">
            <Eye className="h-3.5 w-3.5 text-amber-900" />
          </div>
          <span className="text-sm font-medium text-amber-900">
            Preview Mode
          </span>
          <span className="hidden text-sm text-amber-700 sm:inline">
            — This is how your portfolio will look when published
          </span>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={editUrl}
            className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-200"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <button
            onClick={handleExitPreview}
            className="flex items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-900"
            type="button"
            aria-label="Exit preview mode"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exit Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewBanner;

