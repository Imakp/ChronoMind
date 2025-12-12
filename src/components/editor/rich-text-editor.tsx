"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { HighlightWithTags } from "@/lib/tiptap-extensions/highlight-with-tags";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import { useEffect, useRef } from "react";
import { HighlightMenu } from "./highlight-menu";
import { useHighlightManager } from "@/hooks/use-highlight-manager";
import { useHighlightPersistence } from "@/hooks/use-highlight-persistence";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Highlighter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: any;
  onChange: (content: any) => void;
  placeholder?: string;
  editable?: boolean;
  entityType: string;
  entityId: string;
  userId: string;
  highlights?: any[]; // Accept highlights from parent
  variant?: "default" | "minimal" | "clean";
}

// Helper for cleaner button rendering in bubble menu
const BubbleButton = ({ 
  onClick, 
  isActive, 
  children, 
  label 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  children: React.ReactNode; 
  label: string 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground",
      isActive && "bg-secondary text-foreground font-medium"
    )}
    title={label}
    type="button"
  >
    {children}
  </button>
);

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
  entityType,
  entityId,
  userId,
  highlights = [], // Default to empty array
  variant = 'default'
}: RichTextEditorProps) {
  // Use a ref to track if initial content has been loaded
  const isLoaded = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      HighlightWithTags.configure({
        multicolor: true,
      }),
      BubbleMenuExtension.configure({
        pluginKey: 'bubbleMenu',
      }),
    ],
    content: content || "",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none px-3 sm:px-4 py-3",
          variant === 'minimal' ? "min-h-[300px] sm:prose-base prose-xl px-0 py-0" : "min-h-[200px]"
        ),
      },
    },
  });

  // 1. Standard Manager (Creation & Interaction)
  const {
    menuState,
    updateSelectionState,
    triggerHighlightMenu,
    applyTags,
    closeMenu,
  } = useHighlightManager(editor, { type: entityType, id: entityId }, userId);

  // 2. NEW: Persistence Manager (Restoration)
  // This ensures that even if JSON is stale, DB highlights are painted on mount.
  useHighlightPersistence(editor, highlights);

  // FIX: Prevent content reversion
  // Only update editor content on initial load, not on every content prop change
  useEffect(() => {
    if (editor && content && !isLoaded.current) {
      // Initial load
      editor.commands.setContent(content);
      isLoaded.current = true;
    }
  }, [editor, content]);

  // Reset loaded state when switching entities
  useEffect(() => {
    isLoaded.current = false;
  }, [entityId]);

  if (!editor) {
    return null;
  }



  return (
    <div 
      className={cn(
        "relative rounded-lg bg-white",
        variant === 'default' && "border border-gray-300",
        variant === 'minimal' && "border-none bg-transparent shadow-none"
      )}
    >
      {/* 1. FLOATING BUBBLE MENU 
        Only shows when text is selected and editor is editable 
      */}
      {editable && (
        <BubbleMenu
          editor={editor} 
          options={{ placement: 'top' }}
          className="flex items-center gap-0.5 p-1 bg-background border border-border/60 rounded-xl shadow-xl shadow-black/10 backdrop-blur-sm"
        >
          <BubbleButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            label="Bold"
          >
            <Bold className="w-4 h-4" />
          </BubbleButton>
          
          <BubbleButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            label="Italic"
          >
            <Italic className="w-4 h-4" />
          </BubbleButton>

          <BubbleButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            label="Heading"
          >
            <Heading2 className="w-4 h-4" />
          </BubbleButton>

          <div className="w-px h-4 bg-border mx-1" />

          <BubbleButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            label="Bullet List"
          >
            <List className="w-4 h-4" />
          </BubbleButton>

          <BubbleButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            label="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </BubbleButton>

          <div className="w-px h-4 bg-border mx-1" />

          <BubbleButton
            onClick={triggerHighlightMenu}
            isActive={menuState.isOpen}
            label="Highlight & Tag"
          >
            <Highlighter className="w-4 h-4 text-amber-500" />
          </BubbleButton>
        </BubbleMenu>
      )}
      {editable && variant !== 'minimal' && (
        <div className="flex items-center flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <Button
            onClick={() => editor.chain().focus().toggleBold().run()}
            variant={editor.isActive("bold") ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            variant={editor.isActive("italic") ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            variant={
              editor.isActive("heading", { level: 2 }) ? "default" : "outline"
            }
            size="sm"
            className="h-8 w-8 p-0"
            title="Heading"
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            variant={editor.isActive("bulletList") ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            variant={editor.isActive("orderedList") ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <div className="hidden sm:block w-px h-6 bg-gray-300 mx-1" />
          <Button
            onClick={triggerHighlightMenu}
            onMouseDown={(e) => e.preventDefault()}
            variant={menuState.isOpen ? "default" : "outline"}
            size="sm"
            className="h-8 px-2 sm:px-3 flex-1 sm:flex-initial"
            title="Highlight selected text"
          >
            <Highlighter className="w-4 h-4 mr-1" />
            <span className="hidden xs:inline">Highlight</span>
          </Button>
        </div>
      )}

      {/* Floating Toolbar for Minimal Variant - Optional future enhancement, for now just no toolbar implies pure writing flow */}
      {/* If minimal, we can maybe show a bubble menu, but for now let's keep it simple as requested: just the editor */}

      <div onMouseUp={updateSelectionState} onKeyUp={updateSelectionState}>
        <EditorContent editor={editor} />
      </div>

      {menuState.isOpen && menuState.selection && (
        <HighlightMenu
          position={menuState.position}
          selectedText={menuState.selection.text}
          onTagsAssign={applyTags}
          onClose={closeMenu}
          userId={userId}
        />
      )}

      <style jsx global>{`
        .highlight-with-tags {
          background-color: #fef08a;
          padding: 2px 0;
          border-radius: 2px;
          cursor: pointer;
        }

        .highlight-with-tags:hover {
          background-color: #fde047;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }

        @media (max-width: 640px) {
          .ProseMirror.prose {
            font-size: 15px;
            line-height: 1.6;
          }

          .ProseMirror.prose h2 {
            font-size: 1.4em;
            margin-top: 1.2em;
            margin-bottom: 0.6em;
          }

          .ProseMirror.prose ul,
          .ProseMirror.prose ol {
            padding-left: 1.25em;
          }
        }
      `}</style>
    </div>
  );
}
