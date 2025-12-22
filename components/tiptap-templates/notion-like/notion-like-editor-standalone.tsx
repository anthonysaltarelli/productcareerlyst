"use client"

import { useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
import type { JSONContent } from "@tiptap/react"
import { createPortal } from "react-dom"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Mention } from "@tiptap/extension-mention"
import { TaskList, TaskItem } from "@tiptap/extension-list"
import { Color, TextStyle } from "@tiptap/extension-text-style"
import { Placeholder, Selection } from "@tiptap/extensions"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Superscript } from "@tiptap/extension-superscript"
import { Subscript } from "@tiptap/extension-subscript"
import { TextAlign } from "@tiptap/extension-text-align"
import { Mathematics } from "@tiptap/extension-mathematics"
import { Ai } from "@tiptap-pro/extension-ai"
import { UniqueID } from "@tiptap/extension-unique-id"
import { Emoji, gitHubEmojis } from "@tiptap/extension-emoji"

// --- Hooks ---
import { useUiEditorState } from "@/hooks/use-ui-editor-state"
import { useScrollToHash } from "@/components/tiptap-ui/copy-anchor-link-button/use-scroll-to-hash"

// --- Custom Extensions ---
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { UiState } from "@/components/tiptap-extension/ui-state-extension"
import { Image } from "@/components/tiptap-node/image-node/image-node-extension"
import { NodeBackground } from "@/components/tiptap-extension/node-background-extension"
import { NodeAlignment } from "@/components/tiptap-extension/node-alignment-extension"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"

// --- Table Node ---
import { TableKit } from "@/components/tiptap-node/table-node/extensions/table-node-extension"
import { TableHandleExtension } from "@/components/tiptap-node/table-node/extensions/table-handle"
import { TableHandle } from "@/components/tiptap-node/table-node/ui/table-handle/table-handle"
import { TableSelectionOverlay } from "@/components/tiptap-node/table-node/ui/table-selection-overlay"
import { TableCellHandleMenu } from "@/components/tiptap-node/table-node/ui/table-cell-handle-menu"
import { TableExtendRowColumnButtons } from "@/components/tiptap-node/table-node/ui/table-extend-row-column-button"
import "@/components/tiptap-node/table-node/styles/prosemirror-table.scss"
import "@/components/tiptap-node/table-node/styles/table-node.scss"

import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { EmojiDropdownMenu } from "@/components/tiptap-ui/emoji-dropdown-menu"
import { MentionDropdownMenu } from "@/components/tiptap-ui/mention-dropdown-menu"
import { SlashDropdownMenu } from "@/components/tiptap-ui/slash-dropdown-menu"
import { DragContextMenu } from "@/components/tiptap-ui/drag-context-menu"
import { AiMenu } from "@/components/tiptap-ui/ai-menu"

// --- Contexts ---
import { AppProvider } from "@/contexts/app-context"
import { AiProvider, useAi } from "@/contexts/ai-context"
import { createContext } from "react"

// ============================================================================
// Standalone Editor Context (for exposing save/discard to parent)
// ============================================================================

interface StandaloneEditorContextValue {
  save: () => Promise<void>
  discard: () => void
  getContent: () => JSONContent | null
  hasUnsavedChanges: boolean
  isSaving: boolean
}

const StandaloneEditorContext = createContext<StandaloneEditorContextValue | null>(null)

/**
 * Hook to access standalone editor actions from parent components
 * Must be used within a component that is a child of NotionEditorStandalone
 */
export const useStandaloneEditor = () => {
  const context = useContext(StandaloneEditorContext)
  return context
}

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"
import { TIPTAP_AI_APP_ID } from "@/lib/tiptap-collab-utils"

// --- Styles ---
import "@/components/tiptap-templates/notion-like/notion-like-editor.scss"

// --- Content ---
import { NotionEditorHeader } from "@/components/tiptap-templates/notion-like/notion-like-editor-header"
import { MobileToolbar } from "@/components/tiptap-templates/notion-like/notion-like-editor-mobile-toolbar"
import { NotionToolbarFloating } from "@/components/tiptap-templates/notion-like/notion-like-editor-toolbar-floating"

// ============================================================================
// Types
// ============================================================================

/**
 * Ref interface for NotionEditorStandalone
 * Allows parent components to trigger save/discard actions
 */
export interface NotionEditorStandaloneRef {
  /** Save the current content */
  save: () => Promise<void>
  /** Discard changes and reset to initial content */
  discard: () => void
  /** Get the current content as JSON */
  getContent: () => JSONContent | null
  /** Check if there are unsaved changes */
  hasUnsavedChanges: boolean
  /** Check if save is in progress */
  isSaving: boolean
}

export interface NotionEditorStandaloneProps {
  /** Initial content to load into the editor (TipTap JSON format) */
  initialContent?: JSONContent
  /** Placeholder text when editor is empty */
  placeholder?: string
  /** Callback when user wants to save - receives the current content */
  onSave?: (content: JSONContent) => Promise<void>
  /** Callback when user wants to discard changes */
  onDiscard?: () => void
  /** Callback when content changes (for tracking unsaved state externally) */
  onContentChange?: (hasChanges: boolean) => void
  /** Whether the editor is in read-only mode */
  readOnly?: boolean
}

export interface EditorProviderStandaloneProps {
  initialContent?: JSONContent
  placeholder?: string
  aiToken: string | null
  onSave?: (content: JSONContent) => Promise<void>
  onDiscard?: () => void
  onContentChange?: (hasChanges: boolean) => void
  readOnly?: boolean
  /** Ref to expose save/discard methods */
  editorRef?: React.RefObject<NotionEditorStandaloneRef | null>
}

// ============================================================================
// Loading Spinner
// ============================================================================

export function LoadingSpinner({ text = "Loading editor..." }: { text?: string }) {
  return (
    <div className="spinner-container">
      <div className="spinner-content">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="spinner-loading-text">{text}</div>
      </div>
    </div>
  )
}

// ============================================================================
// Editor Content Area
// ============================================================================

export function EditorContentArea() {
  const { editor } = useContext(EditorContext)!
  const {
    aiGenerationIsLoading,
    aiGenerationIsSelection,
    aiGenerationHasMessage,
    isDragging,
  } = useUiEditorState(editor)

  // Selection based effect to handle AI generation acceptance
  useEffect(() => {
    if (!editor) return

    if (
      !aiGenerationIsLoading &&
      aiGenerationIsSelection &&
      aiGenerationHasMessage
    ) {
      editor.chain().focus().aiAccept().run()
      editor.commands.resetUiState()
    }
  }, [
    aiGenerationHasMessage,
    aiGenerationIsLoading,
    aiGenerationIsSelection,
    editor,
  ])

  useScrollToHash()

  if (!editor) {
    return null
  }

  return (
    <EditorContent
      editor={editor}
      role="presentation"
      className="notion-like-editor-content"
      style={{
        cursor: isDragging ? "grabbing" : "auto",
      }}
    >
      <DragContextMenu />
      <AiMenu />
      <EmojiDropdownMenu />
      <MentionDropdownMenu />
      <SlashDropdownMenu />
      <NotionToolbarFloating />

      {createPortal(<MobileToolbar />, document.body)}
    </EditorContent>
  )
}

// ============================================================================
// Editor Provider (Standalone - No Collaboration)
// ============================================================================

export function EditorProviderStandalone(props: EditorProviderStandaloneProps) {
  const {
    initialContent,
    placeholder = "Start writing...",
    aiToken,
    onSave,
    onDiscard,
    onContentChange,
    readOnly = false,
    editorRef,
  } = props

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const initialContentRef = useRef<JSONContent | undefined>(initialContent)
  const isInitializedRef = useRef(false)

  // Log AI configuration for debugging
  useEffect(() => {
    console.log("[TipTap Editor] EditorProviderStandalone mounted", {
      hasAiToken: !!aiToken,
      aiTokenLength: aiToken?.length || 0,
      aiTokenPreview: aiToken ? `${aiToken.slice(0, 20)}...` : "none",
      aiAppId: TIPTAP_AI_APP_ID || "NOT_SET",
      aiAppIdLength: TIPTAP_AI_APP_ID?.length || 0,
      aiEnabled: !!(aiToken && TIPTAP_AI_APP_ID),
    })
  }, [aiToken])

  // Default empty document
  const defaultContent: JSONContent = {
    type: "doc",
    content: [{ type: "paragraph" }],
  }

  // Determine if AI should be enabled
  const shouldEnableAi = !!(aiToken && TIPTAP_AI_APP_ID)

  if (aiToken && !TIPTAP_AI_APP_ID) {
    console.error("[TipTap Editor] AI token present but TIPTAP_AI_APP_ID is missing!")
  }
  if (!aiToken && TIPTAP_AI_APP_ID) {
    console.warn("[TipTap Editor] TIPTAP_AI_APP_ID present but no AI token available")
  }

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    content: initialContent || defaultContent,
    editorProps: {
      attributes: {
        class: "notion-like-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        dropcursor: {
          width: 2,
        },
        link: { openOnClick: false },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder,
        emptyNodeClass: "is-empty with-slash",
      }),
      Mention,
      Emoji.configure({
        emojis: gitHubEmojis.filter(
          (emoji) => !emoji.name.includes("regional")
        ),
        forceFallbackImages: true,
      }),
      TableKit.configure({
        table: {
          resizable: true,
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
      Selection,
      Image,
      TableHandleExtension,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      UniqueID.configure({
        types: [
          "table",
          "paragraph",
          "bulletList",
          "orderedList",
          "taskList",
          "heading",
          "blockquote",
          "codeBlock",
        ],
      }),
      Typography,
      UiState,
      // AI extension - only enable if both token AND appId are available
      ...(shouldEnableAi
        ? [
            Ai.configure({
              appId: TIPTAP_AI_APP_ID,
              token: aiToken,
              autocompletion: false,
              showDecorations: true,
              hideDecorationsOnStreamEnd: false,
              onLoading: (context) => {
                context.editor.commands.aiGenerationSetIsLoading(true)
                context.editor.commands.aiGenerationHasMessage(false)
              },
              onChunk: (context) => {
                context.editor.commands.aiGenerationSetIsLoading(true)
                context.editor.commands.aiGenerationHasMessage(true)
              },
              onSuccess: (context) => {
                const hasMessage = !!context.response
                context.editor.commands.aiGenerationSetIsLoading(false)
                context.editor.commands.aiGenerationHasMessage(hasMessage)
              },
            }),
          ]
        : []),
    ],
    onUpdate: ({ editor }) => {
      // Skip the initial content load
      if (!isInitializedRef.current) {
        isInitializedRef.current = true
        return
      }

      // Check if content has changed from initial
      const currentContent = editor.getJSON()
      const hasChanges =
        JSON.stringify(currentContent) !==
        JSON.stringify(initialContentRef.current || defaultContent)

      setHasUnsavedChanges(hasChanges)
      onContentChange?.(hasChanges)
    },
  })

  // Handle save
  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return

    setIsSaving(true)
    try {
      const content = editor.getJSON()
      await onSave(content)
      // Update the initial content reference after successful save
      initialContentRef.current = content
      setHasUnsavedChanges(false)
      onContentChange?.(false)
    } catch (error) {
      console.error("Failed to save:", error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [editor, onSave, onContentChange])

  // Handle discard
  const handleDiscard = useCallback(() => {
    if (!editor) return

    // Reset editor to initial content
    const contentToRestore = initialContentRef.current || defaultContent
    editor.commands.setContent(contentToRestore)
    setHasUnsavedChanges(false)
    onContentChange?.(false)
    onDiscard?.()
  }, [editor, onDiscard, onContentChange, defaultContent])

  // Before unload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Expose save/discard methods via ref
  useImperativeHandle(editorRef, () => ({
    save: handleSave,
    discard: handleDiscard,
    getContent: () => editor?.getJSON() || null,
    hasUnsavedChanges,
    isSaving,
  }), [handleSave, handleDiscard, hasUnsavedChanges, isSaving, editor])

  if (!editor) {
    return <LoadingSpinner />
  }

  return (
    <div className="notion-like-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <NotionEditorHeader />
        <EditorContentArea />

        <TableExtendRowColumnButtons />
        <TableHandle />
        <TableSelectionOverlay
          showResizeHandles={true}
          cellMenu={(props) => (
            <TableCellHandleMenu
              editor={props.editor}
              onMouseDown={(e) => props.onResizeStart?.("br")(e)}
            />
          )}
        />
      </EditorContext.Provider>
    </div>
  )
}

// ============================================================================
// Main Export: NotionEditorStandalone
// ============================================================================

/**
 * Props with ref for NotionEditorStandalone
 */
export interface NotionEditorStandalonePropsWithRef extends NotionEditorStandaloneProps {
  /** Ref to access save/discard/getContent methods */
  editorRef?: React.RefObject<NotionEditorStandaloneRef | null>
}

/**
 * Standalone Notion-like editor that saves to your own database.
 * No TipTap Cloud collaboration - just local editing with manual save/discard.
 *
 * Features:
 * - All TipTap formatting and features (tables, images, code blocks, etc.)
 * - AI writing assistance (requires TipTap AI token)
 * - Slash commands, emoji picker, drag & drop
 * - Unsaved changes tracking with before-unload warning
 * - Save/Discard functionality
 * 
 * @example
 * const editorRef = useRef<NotionEditorStandaloneRef>(null);
 * 
 * // In your component:
 * <NotionEditorStandalone
 *   editorRef={editorRef}
 *   initialContent={content}
 *   onSave={async (content) => { await saveToDb(content) }}
 * />
 * 
 * // To trigger save from parent:
 * editorRef.current?.save()
 */
export function NotionEditorStandalone({
  initialContent,
  placeholder = "Start writing...",
  onSave,
  onDiscard,
  onContentChange,
  readOnly = false,
  editorRef,
}: NotionEditorStandalonePropsWithRef) {
  return (
    <AppProvider>
      <AiProvider>
        <NotionEditorStandaloneContent
          initialContent={initialContent}
          placeholder={placeholder}
          onSave={onSave}
          onDiscard={onDiscard}
          onContentChange={onContentChange}
          readOnly={readOnly}
          editorRef={editorRef}
        />
      </AiProvider>
    </AppProvider>
  )
}

/**
 * Internal component that consumes the AI context
 */
function NotionEditorStandaloneContent({
  initialContent,
  placeholder,
  onSave,
  onDiscard,
  onContentChange,
  readOnly,
  editorRef,
}: NotionEditorStandalonePropsWithRef) {
  const { aiToken, isLoadingToken } = useAi()

  // Wait for AI token to load (or timeout)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // If token loading is complete (either success or failure), proceed
    if (!isLoadingToken) {
      setIsReady(true)
      return
    }

    // If we have a token already, proceed immediately
    if (aiToken !== null) {
      setIsReady(true)
      return
    }

    // Wait up to 5 seconds for the AI token to load
    // If it doesn't arrive, proceed without it (AI features will be disabled)
    const timeout = setTimeout(() => {
      console.warn('AI token did not load in time, proceeding without AI features')
      setIsReady(true)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [aiToken, isLoadingToken])

  if (!isReady) {
    return <LoadingSpinner text="Initializing AI features..." />
  }

  return (
    <EditorProviderStandalone
      initialContent={initialContent}
      placeholder={placeholder}
      aiToken={aiToken}
      onSave={onSave}
      onDiscard={onDiscard}
      onContentChange={onContentChange}
      readOnly={readOnly}
      editorRef={editorRef}
    />
  )
}


