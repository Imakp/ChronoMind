import { useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";

type HighlightWithTags = {
  id: string;
  tiptapId: string;
  text: string;
  startOffset: number;
  endOffset: number;
  tags?: Array<{ id: string; name: string }>;
};

export function useHighlightPersistence(
  editor: Editor | null,
  highlights: HighlightWithTags[] = []
) {
  // Prevent running restoration multiple times for the same dataset
  const hasRestored = useRef(false);

  useEffect(() => {
    if (!editor || !highlights.length || hasRestored.current) return;

    // We use a single transaction to apply all missing highlights at once
    // This is highly performant (one re-render)
    const { state, view } = editor;
    let transaction = state.tr;
    let modified = false;

    highlights.forEach((h) => {
      // 1. Validate Position: Ensure offsets are within document bounds
      if (h.endOffset > state.doc.content.size) return;

      // 2. Validate Content: Prevent "Ghost Highlights" if text changed
      // We check if the text at these coordinates matches what we stored.
      // If the user deleted the text, we skip restoring the highlight.
      try {
        const currentText = state.doc.textBetween(
          h.startOffset,
          h.endOffset,
          " " // treat block nodes as spaces
        );

        if (currentText === h.text) {
          // 3. Check for existing mark to avoid duplicates
          // We look for a 'highlightWithTags' mark with the matching ID
          let hasMark = false;
          state.doc.nodesBetween(h.startOffset, h.endOffset, (node) => {
            if (hasMark) return false; // stop searching if found
            if (node.marks) {
              hasMark = node.marks.some(
                (m) =>
                  m.type.name === "highlightWithTags" &&
                  m.attrs.id === h.tiptapId
              );
            }
          });

          // 4. Apply Mark if missing
          if (!hasMark) {
            // Create the mark using the stored metadata
            const mark = state.schema.marks.highlightWithTags.create({
              id: h.tiptapId,
              tags: h.tags?.map((t: any) => t.name) || [], // Ensure tags are mapped correctly
            });

            transaction.addMark(h.startOffset, h.endOffset, mark);
            modified = true;
          }
        }
      } catch (e) {
        console.warn("Failed to restore highlight:", h.id, e);
      }
    });

    // 5. Dispatch Transaction if changes were made
    if (modified) {
      view.dispatch(transaction);
      // console.log("🔄 Restored missing highlights from DB");
    }

    hasRestored.current = true;
  }, [editor, highlights]);

  // Reset lock if highlights change (e.g. switching days)
  useEffect(() => {
    hasRestored.current = false;
  }, [highlights]);
}
