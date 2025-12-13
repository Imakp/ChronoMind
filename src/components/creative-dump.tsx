"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

import { EditorWithPersistence } from "./editor";
import type { CreativeNoteWithRelations, TiptapContent } from "@/types";
import {
  createCreativeNote,
  updateCreativeNote,
  deleteCreativeNote,
} from "@/lib/actions";
import { Button } from "./ui/button";
import { Trash2, Hash, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";



interface CreativeDumpProps {
  yearId: string;
  year: number;
  initialData?: CreativeNoteWithRelations[];
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

export function CreativeDump({ yearId, initialData }: CreativeDumpProps) {
  const [notes, setNotes] = useState<CreativeNoteWithRelations[]>(initialData || []);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  // Sync with server props (render-time adjustment pattern)
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setNotes(initialData || []);
  }
  const [editingNote, setEditingNote] = useState<CreativeNoteWithRelations | null>(null);
  const [savingNotes, setSavingNotes] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const router = useRouter();
  const saveTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const notesRef = useRef<CreativeNoteWithRelations[]>([]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Sync with server
  // Sync with server




  const handleCreateNote = async () => {
    startTransition(async () => {
      const result = await createCreativeNote(yearId, {
        type: "doc",
        content: [],
      });
      if (result.success && result.data) {
        // Optimistic update - we need to cast or ensure data matches
        // For now, assuming result.data matches CreativeNoteWithRelations (empty highlights)
        const newNote = { ...result.data, highlights: [] } as CreativeNoteWithRelations;
        router.refresh();
        setNotes([newNote, ...notes]);
        setEditingNote(newNote);
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

  const handleContentChange = useCallback((noteId: string, content: TiptapContent) => {
    setNotes((prev) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const getPlainText = (content: unknown) => {
    if (!content) return "Empty note...";
    const typedContent = content as TiptapContent;
    if (!typedContent.content) return "Empty note...";
    
    const text = typedContent.content?.map((node) => node.content?.map((t) => t.text).join(" ") || "").join(" ");
    return text?.trim() || "Empty note...";
  };

  const isEditing = !!editingNote;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 relative">
      <div className={cn("transition-all duration-500", isEditing ? "opacity-20 blur-sm pointer-events-none" : "opacity-100")}>
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

        <motion.div 
           layout
           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8"
        >
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
        </motion.div>
      </div>

      {/* ZEN EDITOR OVERLAY */}
      <AnimatePresence>
        {isEditing && editingNote && (
          <motion.div
            key="creative-zen-editor"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background overflow-y-auto p-4 sm:p-12 md:p-20"
          >
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              {/* Header/Close Button */}
              <div className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setEditingNote(null)}
                        className="rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900">
                      Creative Spark
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                     {savingNotes.has(editingNote.id) && (
                        <span className="text-xs animate-pulse font-mono text-muted-foreground">
                            Saving...
                        </span>
                     )}
                    <Button
                        onClick={() => setEditingNote(null)}
                        className="rounded-full shadow-lg"
                    >
                        Done Capturing
                    </Button>
                </div>
              </div>

              {/* Editor Area */}
              <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-8">
                <div className="max-w-3xl mx-auto h-full">
                  <EditorWithPersistence
                    key={editingNote.id}
                    entityType="creativeNote"
                    entityId={editingNote.id}
                    initialContent={(editingNote.content as unknown as TiptapContent) ?? undefined}
                    onContentChange={(c) => handleContentChange(editingNote.id, c)}
                    placeholder="Capture the idea..."
                    variant="minimal" // Zen Mode variant
                    className="prose-lg"
                    highlights={editingNote.highlights || []}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
