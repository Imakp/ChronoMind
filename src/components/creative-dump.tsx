"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreativeNote } from "@prisma/client";
import { EditorWithPersistence } from "./editor";
import {
  createCreativeNote,
  updateCreativeNote,
  deleteCreativeNote,
  getCreativeNotes,
} from "@/lib/actions";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Trash2, Hash, Sparkles, Calendar } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CreativeDumpProps {
  yearId: string;
  year: number;
}

// Vibrant "Sticky Note" colors
const NOTE_COLORS = [
  "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
  "bg-pink-100 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800",
  "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800",
  "bg-lime-100 dark:bg-lime-900/30 border-lime-200 dark:border-lime-800",
  "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
];

const getNoteColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return NOTE_COLORS[Math.abs(hash) % NOTE_COLORS.length];
};

export function CreativeDump({ yearId }: CreativeDumpProps) {
  const [notes, setNotes] = useState<CreativeNote[]>([]);
  const [editingNote, setEditingNote] = useState<CreativeNote | null>(null);
  const [savingNotes, setSavingNotes] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const saveTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const notesRef = useRef<CreativeNote[]>([]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    loadNotes();
  }, [yearId]);

  const loadNotes = async () => {
    const result = await getCreativeNotes(yearId);
    if (result.success && result.data) {
      setNotes(result.data);
    }
  };

  const handleCreateNote = async () => {
    startTransition(async () => {
      const result = await createCreativeNote(yearId, {
        type: "doc",
        content: [],
      });
      if (result.success && result.data) {
        router.refresh();
        setNotes([result.data, ...notes]);
        setEditingNote(result.data);
        toast.success("New note created");
      }
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Scrap this idea?")) return;
    startTransition(async () => {
      const result = await deleteCreativeNote(noteId);
      if (result.success) {
        if (editingNote?.id === noteId) setEditingNote(null);
        setNotes(notes.filter((n) => n.id !== noteId));
        router.refresh();
        toast.success("Note deleted");
      }
    });
  };

  const handleContentChange = useCallback((noteId: string, content: any) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, content: content as any } : n))
    );

    const existingTimeout = saveTimeoutsRef.current.get(noteId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(async () => {
      setSavingNotes((prev) => new Set(prev).add(noteId));
      await updateCreativeNote(noteId, content);
      setSavingNotes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    }, 1000);

    saveTimeoutsRef.current.set(noteId, timeout);
  }, []);

  const getPlainText = (content: any) => {
    if (!content || !content.content) return "Empty note...";
    const text = content.content
      .map((node: any) => node.content?.map((t: any) => t.text).join(" ") || "")
      .join(" ");
    return text.trim() || "Empty note...";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium text-foreground tracking-tight">
            Creative Dump
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Unstructured space for brainwaves, drafts, and sparks.
          </p>
        </div>
        <Button
          onClick={handleCreateNote}
          size="lg"
          className="shadow-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white border-none hover:opacity-90"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          New Spark
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {notes.map((note, i) => {
            const colorClass = getNoteColor(note.id);
            const text = getPlainText(note.content);
            const isShort = text.length < 50;

            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setEditingNote(note)}
                className="h-full"
              >
                <div
                  className={cn(
                    "relative group cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:rotate-1 min-h-[180px] flex flex-col justify-between",
                    colorClass
                  )}
                >
                  {/* Content Preview */}
                  <div
                    className={cn(
                      "font-serif text-foreground/90 leading-relaxed overflow-hidden",
                      isShort
                        ? "text-xl font-medium text-center flex items-center justify-center h-full"
                        : "text-sm line-clamp-6"
                    )}
                  >
                    {text}
                  </div>

                  {/* Metadata Footer */}
                  <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-mono font-medium flex items-center gap-1">
                      {new Date(note.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {notes.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-border/50 rounded-xl bg-secondary/5">
            <Hash className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Your canvas is blank.</p>
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog
        open={!!editingNote}
        onOpenChange={(open) => !open && setEditingNote(null)}
      >
        <DialogContent
          className={cn(
            "max-w-2xl h-[80vh] flex flex-col p-0 gap-0 shadow-2xl border-none",
            editingNote
              ? getNoteColor(editingNote.id).split(" ")[0]
              : "bg-background"
          )}
        >
          {editingNote && (
            <>
              <div className="px-6 py-4 border-b border-black/5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 text-sm font-medium opacity-70">
                  <Calendar className="w-4 h-4" />
                  {new Date(editingNote.createdAt).toLocaleString()}
                </div>
                {savingNotes.has(editingNote.id) && (
                  <span className="text-xs animate-pulse font-mono">
                    Saving...
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                <EditorWithPersistence
                  key={editingNote.id}
                  entityType="creativeNote"
                  entityId={editingNote.id}
                  initialContent={editingNote.content}
                  onContentChange={(content) =>
                    handleContentChange(editingNote.id, content)
                  }
                  placeholder="Start typing..."
                  highlights={(editingNote as any).highlights || []}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
