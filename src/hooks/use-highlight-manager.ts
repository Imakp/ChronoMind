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

  // 1. Capture Selection (Attached to onMouseUp/onKeyUp)
  // This tracks WHERE the user selected, but does NOT open the menu.
  const updateSelectionState = useCallback(() => {
    if (!editor || editor.state.selection.empty) {
      // Only close if the menu was open and selection is now gone
      if (menuState.isOpen) {
        setMenuState((prev) => ({ ...prev, isOpen: false, selection: null }));
      }
      return;
    }

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    
    // Calculate position strictly based on the end of the selection
    const coords = editor.view.coordsAtPos(to);

    setMenuState((prev) => ({
      ...prev,
      // Keep current open state (don't auto-open, don't auto-close if valid)
      position: { x: coords.left, y: coords.bottom + 10 },
      selection: { from, to, text },
    }));
  }, [editor, menuState.isOpen]);

  // 2. Trigger Menu (Attached to Toolbar Button)
  const triggerHighlightMenu = useCallback(() => {
    if (!editor || editor.state.selection.empty) {
      toast.info("Please select some text first");
      return;
    }
    // Force an update of coordinates just in case
    updateSelectionState();
    setMenuState((prev) => ({ ...prev, isOpen: true }));
  }, [editor, updateSelectionState]);

  // 3. Apply Tags & Persist
  const applyTags = useCallback(
    async (tags: string[]) => {
      if (!editor || !menuState.selection) return;

      setMenuState((prev) => ({ ...prev, isOpen: false }));
      const { from, to, text } = menuState.selection;
      const tiptapId = crypto.randomUUID();

      // A. Optimistic UI Update (Visual Persistence)
      // This applies the <mark> tag internally in Tiptap
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .setHighlight({ tags, id: tiptapId })
        .run();
      
      // B. Trigger immediate JSON Save in Parent
      // Note: editor.chain().run() automatically triggers 'onUpdate', 
      // which bubbles up to your DailyLogs/etc components to save the JSON.

      // C. Server Sync (Metadata Persistence)
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
          tiptapId,
          tagsResult.data.map((t: any) => t.id)
        );
        toast.success("Highlight saved");
      } catch (e) {
        console.error(e);
        toast.error("Failed to save highlight");
        // Revert on failure
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
    updateSelectionState, // Pass to onMouseUp
    triggerHighlightMenu, // Pass to Toolbar Button
    applyTags,
    closeMenu: () => setMenuState((prev) => ({ ...prev, isOpen: false })),
  };
}
