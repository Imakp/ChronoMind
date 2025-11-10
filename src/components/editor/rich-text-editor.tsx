"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { HighlightWithTags } from "@/lib/tiptap-extensions/highlight-with-tags";
import { useState, useCallback, useEffect } from "react";
import { HighlightMenu } from "./highlight-menu";
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
  onHighlight?: (highlightData: {
    text: string;
    tags: string[];
    startOffset: number;
    endOffset: number;
  }) => void;
  placeholder?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  onHighlight,
  placeholder = "Start writing...",
  editable = true,
}: RichTextEditorProps) {
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{
    from: number;
    to: number;
  } | null>(null);

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

  // Force editor content update when content prop changes
  // Use JSON.stringify for deep comparison to detect actual content changes
  useEffect(() => {
    if (!editor) return;

    const currentContent = JSON.stringify(editor.getJSON());
    const newContent = JSON.stringify(content || { type: "doc", content: [] });

    if (currentContent !== newContent) {
      editor.commands.setContent(content || { type: "doc", content: [] });
    }
  }, [content, editor]);

  const handleHighlightClick = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");

    if (!text) return;

    // Get cursor position for menu placement
    const coords = editor.view.coordsAtPos(from);
    setMenuPosition({
      x: coords.left,
      y: coords.bottom + 10,
    });

    setSelectedText(text);
    setSelectionRange({ from, to });
    setShowHighlightMenu(true);
  }, [editor]);

  const handleTagsAssign = useCallback(
    (tags: string[]) => {
      if (!editor || !selectionRange) return;

      const { from, to } = selectionRange;
      const text = editor.state.doc.textBetween(from, to, " ");

      // Generate a unique ID for this highlight
      const highlightId = `highlight-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Apply the highlight mark with tags
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .setHighlight({ tags, id: highlightId })
        .run();

      // Notify parent component about the highlight
      if (onHighlight) {
        onHighlight({
          text,
          tags,
          startOffset: from,
          endOffset: to,
        });
      }

      setShowHighlightMenu(false);
      setSelectionRange(null);
    },
    [editor, selectionRange, onHighlight]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="relative border border-gray-300 rounded-lg bg-white">
      {editable && (
        /* OPTIMIZATION: Added flex-wrap to allow toolbar to wrap on mobile */
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
          {/* OPTIMIZATION: Hide divider on mobile when wrapping, show on larger screens */}
          <div className="hidden sm:block w-px h-6 bg-gray-300 mx-1" />
          {/* OPTIMIZATION: Make Highlight button full-width on mobile after wrap */}
          <Button
            onClick={handleHighlightClick}
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

      <EditorContent editor={editor} />

      {showHighlightMenu && (
        <HighlightMenu
          position={menuPosition}
          selectedText={selectedText}
          onTagsAssign={handleTagsAssign}
          onClose={() => setShowHighlightMenu(false)}
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

        /* OPTIMIZATION: Responsive prose styles for better mobile reading */
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
