"use client";

import { useState, useCallback, useEffect } from "react";
import { RichTextEditor } from "./rich-text-editor";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface EditorWithPersistenceProps {
  entityType: "creativeNote" | "lesson" | "dailyLog" | "quarterlyReflection" | "chapter";
  entityId: string;
  initialContent?: any;
  onContentChange?: (content: any) => void;
  placeholder?: string;
  editable?: boolean;
  highlights?: any[];
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
  const [content, setContent] = useState(initialContent);

  // Reset content when entityId or initialContent changes
  useEffect(() => {
    setContent(initialContent);
  }, [entityId, initialContent]);

  const handleContentChange = useCallback(
    (newContent: any) => {
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
