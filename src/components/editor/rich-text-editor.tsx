"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { HighlightWithTags } from "@/lib/tiptap-extensions/highlight-with-tags";
import { useEffect } from "react";
import { HighlightMenu } from "./highlight-menu";
import { useHighlightManager } from "@/hooks/use-highlight-manager";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Highlighter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  content: any;
  onChange: (content: any) => void;
  placeholder?: string;
  editable?: boolean;
  entityType: string;
  entityId: string;
  userId: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
  entityType,
  entityId,
  userId,
}: RichTextEditorProps) {
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
    ],
    content: content || "",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 sm:px-4 py-3",
      },
    },
  });

  // Use the highlight manager hook
  const { menuState, handleSelection, applyTags, closeMenu } =
    useHighlightManager(editor, { type: entityType, id: entityId }, userId);

  // Force editor content update when content prop changes
  useEffect(() => {
    if (!editor) return;

    const currentContent = JSON.stringify(editor.getJSON());
    const newContent = JSON.stringify(content || { type: "doc", content: [] });

    if (currentContent !== newContent) {
      editor.commands.setContent(content || { type: "doc", content: [] });
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative border border-gray-300 rounded-lg bg-white">
      {editable && (
        <div className="flex items-center flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
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
            onClick={handleSelection}
            variant="outline"
            size="sm"
            className="h-8 px-2 sm:px-3 flex-1 sm:flex-initial"
            disabled={editor.state.selection.empty}
            title="Highlight text"
          >
            <Highlighter className="w-4 h-4 mr-1" />
            <span className="hidden xs:inline">Highlight</span>
          </Button>
        </div>
      )}

      <div
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
      >
        <EditorContent editor={editor} />
      </div>

      {menuState.isOpen && menuState.selection && (
        <HighlightMenu
          position={menuState.position}
          selectedText={menuState.selection.text}
          onTagsAssign={applyTags}
          onClose={closeMenu}
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
