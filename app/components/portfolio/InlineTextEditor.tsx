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
}

export default function InlineTextEditor({
  value,
  onSave,
  onCancel,
  placeholder = 'Click to edit...',
  multiline = false,
  className = '',
  style,
}: InlineTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
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

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';
    const inputProps = multiline
      ? {
          rows: Math.max(3, editValue.split('\n').length),
          className: `w-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${className}`,
        }
      : {
          type: 'text',
          className: `w-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${className}`,
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
          style={style}
          {...inputProps}
        />
        {multiline && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            Cmd/Ctrl + Enter to save, Esc to cancel
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`cursor-text hover:bg-blue-50 rounded px-1 py-0.5 transition-colors ${className}`}
      style={style}
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </div>
  );
}

