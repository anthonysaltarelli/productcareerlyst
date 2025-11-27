'use client';

/**
 * SimpleBioEditor Component
 * 
 * A minimal TipTap editor for portfolio bios with only bold, italic, and underline support.
 * Features a simple fixed toolbar above the editor.
 */

import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline as UnderlineIcon } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface SimpleBioEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

// ============================================================================
// Helper: Convert plain text to HTML if needed
// ============================================================================

const ensureHtmlFormat = (content: string): string => {
  if (!content || content.trim() === '') {
    return '';
  }
  
  // If it already looks like HTML, return as-is
  if (content.trim().startsWith('<')) {
    return content;
  }
  
  // Convert plain text to HTML
  // Replace double newlines with paragraph breaks
  // Replace single newlines with <br>
  const paragraphs = content.split(/\n\n+/);
  return paragraphs
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
};

// ============================================================================
// Main Component
// ============================================================================

export const SimpleBioEditor = ({
  content,
  onChange,
  placeholder = 'Tell visitors about yourself, your experience, and what you\'re passionate about...',
  className = '',
}: SimpleBioEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Disable features we don't need for a simple bio
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: ensureHtmlFormat(content),
    editorProps: {
      attributes: {
        class: 'simple-bio-editor-content focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Only call onChange if content actually changed
      onChange(html);
    },
  });

  // Update editor content when prop changes (e.g., on cancel/reset)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const formattedContent = ensureHtmlFormat(content);
      if (formattedContent !== editor.getHTML()) {
        editor.commands.setContent(formattedContent);
      }
    }
  }, [content, editor]);

  const handleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const handleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const handleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  if (!isMounted) {
    return (
      <div className={`min-h-[200px] rounded-lg border-2 border-gray-200 bg-gray-50 ${className}`}>
        <div className="flex h-full items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
        </div>
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  return (
    <div className={`simple-bio-editor ${className}`}>
      {/* Fixed Toolbar */}
      <div className="mb-2 flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        <ToolbarButton
          onClick={handleBold}
          isActive={editor.isActive('bold')}
          title="Bold (⌘B)"
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleItalic}
          isActive={editor.isActive('italic')}
          title="Italic (⌘I)"
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleUnderline}
          isActive={editor.isActive('underline')}
          title="Underline (⌘U)"
          aria-label="Toggle underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="ml-2 text-xs text-gray-400">
          Select text and click to format, or use ⌘B, ⌘I, ⌘U
        </span>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="simple-bio-editor-wrapper"
      />

      {/* Scoped styles */}
      <style jsx global>{`
        .simple-bio-editor-wrapper .ProseMirror {
          min-height: 180px;
          padding: 1rem;
          border: 2px solid #a855f7;
          border-radius: 0.5rem;
          background: white;
          font-size: 1rem;
          line-height: 1.75;
          color: #374151;
        }

        .simple-bio-editor-wrapper .ProseMirror:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
        }

        .simple-bio-editor-wrapper .ProseMirror p {
          margin-bottom: 0.75em;
        }

        .simple-bio-editor-wrapper .ProseMirror p:last-child {
          margin-bottom: 0;
        }

        .simple-bio-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }

        .simple-bio-editor-wrapper .ProseMirror strong {
          font-weight: 600;
        }

        .simple-bio-editor-wrapper .ProseMirror em {
          font-style: italic;
        }

        .simple-bio-editor-wrapper .ProseMirror u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// Toolbar Button Component
// ============================================================================

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
  'aria-label': string;
}

const ToolbarButton = ({
  onClick,
  isActive,
  title,
  children,
  'aria-label': ariaLabel,
}: ToolbarButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      tabIndex={0}
      className={`rounded p-1.5 transition-colors ${
        isActive
          ? 'bg-purple-100 text-purple-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
};

export default SimpleBioEditor;
