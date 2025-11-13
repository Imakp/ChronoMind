import { useState, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { createHighlight, getOrCreateTags } from "@/lib/actions";
import { toast } from "sonner";

export function useHighlightManager(
  editor: Editor | null,
  entityContext: { type: string; id: string },
  userId: string
) {
  const [menuState, setMenuState] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    selection: null as { from: number; to: number; text: string } | null,
  });

  const handleSelection = useCallback(() => {
    if (!editor || editor.state.selection.empty) {
      setMenuState((prev) => ({ ...prev, isOpen: false }));
      return;
    }
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    const coords = editor.view.coordsAtPos(from);

    setMenuState({
      isOpen: true,
      position: { x: coords.left, y: coords.bottom + 10 },
      selection: { from, to, text },
    });
  }, [editor]);

  const applyTags = useCallback(
    async (tags: string[]) => {
      if (!editor || !menuState.selection) return;

      setMenuState((prev) => ({ ...prev, isOpen: false }));
      const { from, to, text } = menuState.selection;
      const tiptapId = crypto.randomUUID(); // Generate unique ID

      // 1. Optimistic UI Update
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .setHighlight({ tags, id: tiptapId })
        .run();

      // 2. Server Sync
      try {
        const tagsResult = await getOrCreateTags(userId, tags);
        if (!tagsResult.success || !tagsResult.data)
          throw new Error("Tag error");

        await createHighlight(
          entityContext.type as any,
          entityContext.id,
          text,
          from,
          to,
          tiptapId, // Pass the ID
          tagsResult.data.map((t: any) => t.id)
        );
        toast.success("Highlight saved");
      } catch (e) {
        console.error(e);
        toast.error("Failed to save");
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .unsetHighlight()
          .run();
      }
    },
    [editor, menuState.selection, entityContext, userId]
  );

  return {
    menuState,
    handleSelection,
    applyTags,
    closeMenu: () => setMenuState((prev) => ({ ...prev, isOpen: false })),
  };
}
