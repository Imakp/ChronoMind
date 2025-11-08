"use client";

import { useState, useCallback } from "react";
import { RichTextEditor } from "./rich-text-editor";
import { createHighlight, getOrCreateTags } from "@/lib/actions";
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
  const [isSaving, setIsSaving] = useState(false);

  const handleContentChange = useCallback(
    (newContent: any) => {
      setContent(newContent);
      onContentChange(newContent);
    },
    [onContentChange]
  );

  const handleHighlight = useCallback(
    async (highlightData: {
      text: string;
      tags: string[];
      startOffset: number;
      endOffset: number;
    }) => {
      if (!session?.user?.id) {
        console.error("User not authenticated");
        return;
      }

      setIsSaving(true);

      try {
        // Get or create tags
        const tagsResult = await getOrCreateTags(
          session.user.id,
          highlightData.tags
        );

        if (!tagsResult.success || !tagsResult.data) {
          console.error("Failed to create tags:", tagsResult.error);
          return;
        }

        const tagIds = tagsResult.data.map((tag: { id: string }) => tag.id);

        // Create highlight with tags
        const highlightResult = await createHighlight(
          entityType,
          entityId,
          highlightData.text,
          highlightData.startOffset,
          highlightData.endOffset,
          tagIds
        );

        if (!highlightResult.success) {
          console.error("Failed to create highlight:", highlightResult.error);
          return;
        }

        console.log("Highlight saved successfully:", highlightResult.data);
      } catch (error) {
        console.error("Error saving highlight:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [session, entityType, entityId]
  );

  return (
    <div className="relative">
      {isSaving && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
            Saving...
          </div>
        </div>
      )}
      <RichTextEditor
        content={content}
        onChange={handleContentChange}
        onHighlight={handleHighlight}
        placeholder={placeholder}
        editable={editable}
      />
    </div>
  );
}
