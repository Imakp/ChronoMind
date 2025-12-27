"use client";

import { useState, useCallback } from "react";
import { RichTextEditor } from "./rich-text-editor";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

import type { TiptapContent } from "@/types";
import { Highlight } from "@prisma/client";

interface EditorWithPersistenceProps {
  entityType:
    | "creativeNote"
    | "lesson"
    | "dailyLog"
    | "quarterlyReflection"
    | "chapter";
  entityId: string;
  initialContent?: TiptapContent;
  onContentChange?: (content: TiptapContent) => void;
  placeholder?: string;
  editable?: boolean;
  highlights?: Highlight[];
  variant?: "default" | "minimal" | "clean";
  className?: string;
}

export function EditorWithPersistence({
  entityType,
  entityId,
  initialContent,
  onContentChange,
  placeholder,
  editable = true,
  highlights = [],
  variant,
  className,
}: EditorWithPersistenceProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState<TiptapContent | undefined>(
    initialContent
  );
  const [prevInitialContent, setPrevInitialContent] = useState(initialContent);

  // Sync with server props (render-time adjustment pattern)
  if (initialContent !== prevInitialContent) {
    setPrevInitialContent(initialContent);
    setContent(initialContent);
  }

  const handleContentChange = useCallback(
    (newContent: TiptapContent) => {
      setContent(newContent);
      if (onContentChange) {
        onContentChange(newContent);
      }
    },
    [onContentChange]
  );

  return (
    <div className={cn("relative", className)}>
      <RichTextEditor
        content={content}
        onChange={handleContentChange}
        placeholder={placeholder}
        editable={editable}
        entityType={entityType}
        entityId={entityId}
        userId={session?.user?.id || ""}
        highlights={highlights} // PASS: Forward highlights to RichTextEditor
        variant={variant}
      />
    </div>
  );
}
