"use client"

// --- Tiptap UI ---
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- UI Primitives ---
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import { ButtonGroup } from "@/components/tiptap-ui-primitive/button"

// --- Styles ---
import "@/components/tiptap-templates/notion-like/notion-like-editor-header.scss"

export function NotionEditorHeader() {
  return (
    <header className="notion-like-editor-header">
      <div className="notion-like-editor-header-title">
        <span style={{ 
          fontSize: '0.875rem', 
          fontWeight: 500, 
          color: '#6b7280',
          paddingLeft: '1rem'
        }}>
          Content Editor
        </span>
      </div>
      <Spacer />
      <div className="notion-like-editor-header-actions">
        <ButtonGroup orientation="horizontal">
          <UndoRedoButton action="undo" />
          <UndoRedoButton action="redo" />
        </ButtonGroup>
      </div>
    </header>
  )
}
