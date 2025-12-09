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
import { Plus, Trash2, X } from "lucide-react";

interface CreativeDumpProps {
  yearId: string;
  year: number;
}

export function CreativeDump({ yearId }: CreativeDumpProps) {
  const [notes, setNotes] = useState<CreativeNote[]>([]);
  const [editingNote, setEditingNote] = useState<CreativeNote | null>(null);
  const [savingNotes, setSavingNotes] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Use refs to store timeouts and avoid stale closures
  const saveTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const notesRef = useRef<CreativeNote[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Load all creative notes for the year
  useEffect(() => {
    loadNotes();
  }, [yearId]);

  const loadNotes = async () => {
    const result = await getCreativeNotes(yearId);
    if (result.success && result.data) {
      setNotes(result.data);
    }
  };

  // Create a new creative note
  const handleCreateNote = async () => {
    startTransition(async () => {
      const result = await createCreativeNote(yearId, {
        type: "doc",
        content: [],
      });
      if (result.success && result.data) {
        router.refresh();
        setEditingNote(result.data);
      }
    });
  };

  // Delete a creative note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    startTransition(async () => {
      const result = await deleteCreativeNote(noteId);
      if (result.success) {
        if (editingNote?.id === noteId) {
          setEditingNote(null);
        }
        router.refresh();
      }
    });
  };

  // Auto-save functionality for content
  const handleContentChange = useCallback((noteId: string, content: any) => {
    // Update local state immediately with new content
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, content: content as any } : note
      )
    );

    // Update editing note if it's the one being edited
    setEditingNote((prev) =>
      prev?.id === noteId ? { ...prev, content: content as any } : prev
    );

    // Clear existing timeout for this note
    const existingTimeout = saveTimeoutsRef.current.get(noteId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(async () => {
      setSavingNotes((prev) => new Set(prev).add(noteId));

      try {
        const result = await updateCreativeNote(noteId, content);
      } catch (error) {
        console.error("Error saving creative note content:", error);
      } finally {
        setSavingNotes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(noteId);
          return newSet;
        });
      }
    }, 1000);

    saveTimeoutsRef.current.set(noteId, timeout);
  }, []);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Extract plain text preview from Tiptap content
  const getTextPreview = (content: any): string => {
    if (!content || typeof content !== "object" || !("content" in content)) {
      return "Empty note";
    }

    const text = (content as any).content
      ?.map((node: any) =>
        node.content?.map((textNode: any) => textNode.text || "").join("")
      )
      .join(" ")
      .trim();

    return text || "Empty note";
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-4">
        <div className="flex items-center justify-end">
          <Button
            onClick={handleCreateNote}
            size="sm"
            className="w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <p className="text-muted-foreground mb-4">
              No notes yet. Start dumping your creative ideas!
            </p>
            <Button onClick={handleCreateNote} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create First Note
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-border/60 rounded-lg bg-card shadow-sm hover-elevate cursor-pointer"
                onClick={() => setEditingNote(note)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-xs sm:text-sm text-muted-foreground line-clamp-6 flex-1 font-serif">
                      {getTextPreview(note.content)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-2 font-mono">
                    {formatDate(note.createdAt)}
                  </div>
                  {savingNotes.has(note.id) && (
                    <div className="text-xs text-blue-600 mt-2">Saving...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OPTIMIZATION: Full-screen modal on mobile, centered on desktop */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="bg-card sm:rounded-lg shadow-xl w-full max-w-4xl h-full sm:h-[90vh] flex flex-col border border-border">
            {/* Modal Header */}
            <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-foreground">
                Creative Note
              </h3>
              <Button
                onClick={() => setEditingNote(null)}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <EditorWithPersistence
                key={editingNote.id}
                entityType="creativeNote"
                entityId={editingNote.id}
                initialContent={
                  editingNote.content || { type: "doc", content: [] }
                }
                highlights={(editingNote as any).highlights || []}
                onContentChange={(content) =>
                  handleContentChange(editingNote.id, content)
                }
                placeholder="Let your creativity flow..."
              />
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-4 sm:px-6 py-3 flex items-center justify-between">
              <div className="text-xs sm:text-sm text-muted-foreground truncate font-mono">
                Created {formatDate(editingNote.createdAt)}
              </div>
              {savingNotes.has(editingNote.id) && (
                <div className="text-xs sm:text-sm text-blue-600 shrink-0 ml-2">
                  Saving...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
