'use client';

/**
 * TipTapReadOnly Component
 * 
 * A read-only TipTap renderer for displaying portfolio page content.
 * Renders all TipTap content types (tables, images, code blocks, etc.)
 * without any editing UI, toolbars, or menus.
 */

import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';

// --- Tiptap Core Extensions ---
import { StarterKit } from '@tiptap/starter-kit';
import { Mention } from '@tiptap/extension-mention';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import { Typography } from '@tiptap/extension-typography';
import { Highlight } from '@tiptap/extension-highlight';
import { Superscript } from '@tiptap/extension-superscript';
import { Subscript } from '@tiptap/extension-subscript';
import { TextAlign } from '@tiptap/extension-text-align';
import { Mathematics } from '@tiptap/extension-mathematics';
import { Emoji, gitHubEmojis } from '@tiptap/extension-emoji';

// --- Custom Extensions ---
import { HorizontalRule } from '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension';
import { Image } from '@/components/tiptap-node/image-node/image-node-extension';
import { NodeBackground } from '@/components/tiptap-extension/node-background-extension';
import { NodeAlignment } from '@/components/tiptap-extension/node-alignment-extension';

// --- Table Node ---
import { TableKit } from '@/components/tiptap-node/table-node/extensions/table-node-extension';

// --- Styles ---
import '@/components/tiptap-node/table-node/styles/prosemirror-table.scss';
import '@/components/tiptap-node/table-node/styles/table-node.scss';
import '@/components/tiptap-node/blockquote-node/blockquote-node.scss';
import '@/components/tiptap-node/code-block-node/code-block-node.scss';
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss';
import '@/components/tiptap-node/list-node/list-node.scss';
import '@/components/tiptap-node/image-node/image-node.scss';
import '@/components/tiptap-node/heading-node/heading-node.scss';
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss';
import '@/components/tiptap-templates/notion-like/notion-like-editor.scss';

// ============================================================================
// Types
// ============================================================================

interface TipTapReadOnlyProps {
  /** TipTap JSON content to render */
  content: JSONContent;
  /** Optional className for the wrapper */
  className?: string;
}

// ============================================================================
// Loading Spinner
// ============================================================================

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const TipTapReadOnly = ({ content, className = '' }: TipTapReadOnlyProps) => {
  const [isMounted, setIsMounted] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    content: content,
    editorProps: {
      attributes: {
        class: 'notion-like-editor readonly-mode',
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        dropcursor: false,
        link: { openOnClick: true },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Mention,
      Emoji.configure({
        emojis: gitHubEmojis.filter(
          (emoji) => !emoji.name.includes('regional')
        ),
        forceFallbackImages: true,
      }),
      TableKit.configure({
        table: {
          resizable: false,
          cellMinWidth: 120,
        },
      }),
      NodeBackground,
      NodeAlignment,
      TextStyle,
      Mathematics,
      Superscript,
      Subscript,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
    ],
  });

  if (!isMounted) {
    return <LoadingSpinner />;
  }

  if (!editor) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`tiptap-readonly-wrapper ${className}`}>
      <EditorContent
        editor={editor}
        className="notion-like-editor-content"
      />
      
      {/* Custom styles for read-only mode */}
      <style jsx global>{`
        /* Use Plus Jakarta Sans for read-only content on public pages */
        .tiptap-readonly-wrapper,
        .tiptap-readonly-wrapper .notion-like-editor-content,
        .tiptap-readonly-wrapper .tiptap.ProseMirror {
          font-family: var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        
        /* Reduce list spacing for read-only mode */
        .tiptap-readonly-wrapper .tiptap.ProseMirror ol,
        .tiptap-readonly-wrapper .tiptap.ProseMirror ul {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
        }
        
        /* Reset the notion-like-editor styles for read-only */
        .tiptap-readonly-wrapper .notion-like-editor-content {
          max-width: 100% !important;
          margin: 0 !important;
        }
        
        .tiptap-readonly-wrapper .notion-like-editor-content .tiptap.ProseMirror.notion-like-editor {
          padding: 0 !important;
        }
        
        .tiptap-readonly-wrapper .notion-like-editor.readonly-mode {
          cursor: default;
        }
        
        .tiptap-readonly-wrapper .notion-like-editor.readonly-mode .ProseMirror {
          cursor: default;
        }
        
        /* Hide any drag handles or editing UI - but NOT elements with data-drag-handle="false" */
        .tiptap-readonly-wrapper [data-drag-handle="true"],
        .tiptap-readonly-wrapper .drag-handle,
        .tiptap-readonly-wrapper .resize-handle {
          display: none !important;
        }
        
        /* Make images non-interactive */
        .tiptap-readonly-wrapper .tiptap-image-handle {
          display: none !important;
        }
        
        /* Ensure links are clickable */
        .tiptap-readonly-wrapper a {
          cursor: pointer;
          color: #7c3aed;
        }
        
        .tiptap-readonly-wrapper a:hover {
          text-decoration: underline;
        }
        
        /* Style code blocks nicely */
        .tiptap-readonly-wrapper pre {
          background-color: #1e1e1e;
          border-radius: 0.5rem;
          padding: 1rem;
          overflow-x: auto;
        }
        
        .tiptap-readonly-wrapper pre code {
          color: #d4d4d4;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        /* Style blockquotes */
        .tiptap-readonly-wrapper blockquote {
          border-left: 4px solid #7c3aed;
          padding-left: 1rem;
          margin-left: 0;
          color: #4b5563;
          font-style: italic;
        }
        
        /* Style task lists */
        .tiptap-readonly-wrapper ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        
        .tiptap-readonly-wrapper ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .tiptap-readonly-wrapper ul[data-type="taskList"] input[type="checkbox"] {
          margin-top: 0.25rem;
          pointer-events: none;
        }
        
        /* Style tables */
        .tiptap-readonly-wrapper table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        
        .tiptap-readonly-wrapper th,
        .tiptap-readonly-wrapper td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
          text-align: left;
        }
        
        .tiptap-readonly-wrapper th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        /* Style horizontal rules */
        .tiptap-readonly-wrapper hr {
          border: none;
          border-top: 2px solid #e5e7eb;
        }
        
        /* Style images */
        .tiptap-readonly-wrapper img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        
        /* Image caption wrapper */
        .tiptap-readonly-wrapper .tiptap-image-caption-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin-top: 0.25rem;
        }
        
        /* Image captions */
        .tiptap-readonly-wrapper .tiptap-image-caption {
          text-align: center;
          font-size: 14px;
          color: #4b5563;
        }
        
        /* Unsplash attribution badge - matches cover photo styling */
        .tiptap-readonly-wrapper .tiptap-image-unsplash-attribution {
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }
        
        .tiptap-readonly-wrapper .tiptap-image-unsplash-attribution a {
          color: #374151;
          font-weight: 500;
          text-decoration: none;
        }
        
        .tiptap-readonly-wrapper .tiptap-image-unsplash-attribution a:hover {
          color: #111827;
        }
        
        /* Style inline code */
        .tiptap-readonly-wrapper code:not(pre code) {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 0.875em;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default TipTapReadOnly;

