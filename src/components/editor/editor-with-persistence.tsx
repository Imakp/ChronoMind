"use client";

import { useState, useCallback, useEffect } from "react";
import { RichTextEditor } from "./rich-text-editor";
import { useSession } from "next-auth/react";

interface EditorWithPersistenceProps {
  entityType:
    | "dailyLog"
    | "quarterlyReflection"
    | "goal"
    | "task"
    | "subtask"
    | "chapter"
    | "lesson"
    | "creativeNote";
  entityId: string;
  initialContent: any;
  onContentChange: (content: any) => void;
  placeholder?: string;
  editable?: boolean;
}

export function EditorWithPersistence({
  entityType,
  entityId,
  initialContent,
  onContentChange,
  placeholder,
  editable = true,
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
      onContentChange(newContent);
    },
    [onContentChange]
  );

  return (
    <div className="relative">
      <RichTextEditor
        content={content}
        onChange={handleContentChange}
        placeholder={placeholder}
        editable={editable}
        entityType={entityType}
        entityId={entityId}
        userId={session?.user?.id || ""}
      />
    </div>
  );
}
