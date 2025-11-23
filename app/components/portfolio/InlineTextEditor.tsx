'use client';

import { useState, useRef, useEffect } from 'react';

interface InlineTextEditorProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  useContentEditable?: boolean; // Use contentEditable for styled editing
}

export default function InlineTextEditor({
  value,
  onSave,
  onCancel,
  placeholder = 'Click to edit...',
  multiline = false,
  className = '',
  style,
  useContentEditable = true,
}: InlineTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      if (useContentEditable && contentEditableRef.current) {
        contentEditableRef.current.focus();
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(contentEditableRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      } else if (inputRef.current) {
        inputRef.current.focus();
        if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
          inputRef.current.select();
        }
      }
    }
  }, [isEditing, useContentEditable]);

  useEffect(() => {
    setEditValue(value);
    if (contentEditableRef.current && !isEditing) {
      contentEditableRef.current.textContent = value;
    }
  }, [value, isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    const finalValue = useContentEditable && contentEditableRef.current
      ? contentEditableRef.current.textContent || ''
      : editValue;
    
    if (finalValue !== value) {
      onSave(finalValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    if (contentEditableRef.current) {
      contentEditableRef.current.textContent = value;
    }
    setIsEditing(false);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Delay to allow click events on save button
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 200);
  };

  // Use contentEditable for styled editing
  if (isEditing && useContentEditable) {
    return (
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <div
          ref={contentEditableRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => {
            setEditValue(e.currentTarget.textContent || '');
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={`outline-none border-2 border-blue-500 rounded px-1 py-0.5 min-h-[1.5em] ${className}`}
          style={{
            ...style,
            backgroundColor: 'transparent',
            // Remove default contentEditable styling
            WebkitUserSelect: 'text',
            userSelect: 'text',
          }}
          data-placeholder={placeholder}
        >
          {editValue || ''}
        </div>
        {multiline && (
          <div className="absolute -bottom-6 right-0 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow z-10">
            Cmd/Ctrl + Enter to save, Esc to cancel
          </div>
        )}
        <style dangerouslySetInnerHTML={{
          __html: `
            div[contenteditable][data-placeholder]:empty:before {
              content: attr(data-placeholder);
              color: #9ca3af;
              font-style: italic;
              pointer-events: none;
            }
          `
        }} />
      </div>
    );
  }

  // Fallback to styled input/textarea
  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';
    const inputProps = multiline
      ? {
          rows: Math.max(3, editValue.split('\n').length),
          className: `w-full outline-none border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${className}`,
        }
      : {
          type: 'text',
          className: `w-full outline-none border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 ${className}`,
        };

    return (
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <InputComponent
          ref={inputRef as any}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          style={{
            ...style,
            backgroundColor: 'transparent',
            border: '2px solid #3b82f6',
            padding: '0.125rem 0.25rem',
          }}
          {...inputProps}
        />
        {multiline && (
          <div className="absolute -bottom-6 right-0 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
            Cmd/Ctrl + Enter to save, Esc to cancel
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`cursor-text hover:bg-blue-50/50 rounded px-1 py-0.5 transition-colors ${className}`}
      style={style}
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </div>
  );
}

