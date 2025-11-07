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
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getJSON()) {
      editor.commands.setContent(content || "");
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
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <Button
            onClick={() => editor.chain().focus().toggleBold().run()}
            variant={editor.isActive("bold") ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            variant={editor.isActive("italic") ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
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
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            variant={editor.isActive("bulletList") ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            variant={editor.isActive("orderedList") ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            onClick={handleHighlightClick}
            variant="outline"
            size="sm"
            className="h-8 px-3"
            disabled={editor.state.selection.empty}
          >
            <Highlighter className="w-4 h-4 mr-1" />
            Highlight
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
      `}</style>
    </div>
  );
}
