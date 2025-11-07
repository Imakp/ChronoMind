"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<CreativeNote | null>(null);
  const [savingNotes, setSavingNotes] = useState<Set<string>>(new Set());

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
    setIsLoading(true);
    const result = await getCreativeNotes(yearId);
    if (result.success && result.data) {
      setNotes(result.data);
    }
    setIsLoading(false);
  };

  // Create a new creative note
  const handleCreateNote = async () => {
    const result = await createCreativeNote(yearId, {
      type: "doc",
      content: [],
    });
    if (result.success && result.data) {
      setNotes((prev) => [result.data, ...prev]);
      setEditingNote(result.data);
    }
  };

  // Delete a creative note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    const result = await deleteCreativeNote(noteId);
    if (result.success) {
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      if (editingNote?.id === noteId) {
        setEditingNote(null);
      }
    }
  };

  // Auto-save functionality for content
  const handleContentChange = useCallback((noteId: string, content: any) => {
    console.log("Content change triggered - debouncing...");

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
      console.log("Cleared previous timeout - resetting 1 second timer");
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(async () => {
      console.log("1 second passed - saving content now...");
      setSavingNotes((prev) => new Set(prev).add(noteId));

      try {
        const result = await updateCreativeNote(noteId, content);
        console.log("Content saved successfully:", result);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading creative notes...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Creative Dump</h2>
            <p className="text-sm text-gray-500 mt-1">
              Quick capture for spontaneous thoughts and ideas
            </p>
          </div>
          <Button onClick={handleCreateNote} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-gray-500 mb-4">
              No notes yet. Start dumping your creative ideas!
            </p>
            <Button onClick={handleCreateNote}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Note
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setEditingNote(note)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm text-gray-600 line-clamp-6 flex-1">
                      {getTextPreview(note.content)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors ml-2 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
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

      {/* Full-screen editor modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-700">
                Creative Note
              </h3>
              <Button
                onClick={() => setEditingNote(null)}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <EditorWithPersistence
                key={editingNote.id}
                entityType="creativeNote"
                entityId={editingNote.id}
                initialContent={
                  editingNote.content || { type: "doc", content: [] }
                }
                onContentChange={(content) =>
                  handleContentChange(editingNote.id, content)
                }
                placeholder="Let your creativity flow..."
              />
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Created {formatDate(editingNote.createdAt)}
              </div>
              {savingNotes.has(editingNote.id) && (
                <div className="text-sm text-blue-600">Saving...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
