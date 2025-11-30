'use client';

/**
 * TipTapReadOnlyWrapper
 * 
 * Client-side wrapper for TipTapReadOnly component.
 * Handles dynamic import with SSR disabled for proper hydration.
 */

import dynamic from 'next/dynamic';
import type { JSONContent } from '@tiptap/react';

// Dynamically import TipTapReadOnly with SSR disabled
const TipTapReadOnly = dynamic(
  () => import('@/app/components/TipTapReadOnly').then((mod) => mod.TipTapReadOnly),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
      </div>
    ),
  }
);

interface TipTapReadOnlyWrapperProps {
  content: JSONContent;
  className?: string;
}

export const TipTapReadOnlyWrapper = ({ content, className }: TipTapReadOnlyWrapperProps) => {
  return <TipTapReadOnly content={content} className={className} />;
};

export default TipTapReadOnlyWrapper;


