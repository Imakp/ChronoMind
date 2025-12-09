"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lesson } from "@prisma/client";
import { EditorWithPersistence } from "./editor";
import {
  createLesson,
  updateLesson,
  deleteLesson,
  getLessons,
} from "@/lib/actions";
import { Button } from "./ui/button";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handler";

interface LessonsLearnedProps {
  yearId: string;
  year: number;
}

export function LessonsLearned({ yearId }: LessonsLearnedProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [savingLessons, setSavingLessons] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Use refs to store timeouts and avoid stale closures
  const saveTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lessonsRef = useRef<Lesson[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    lessonsRef.current = lessons;
  }, [lessons]);

  // Load all lessons for the year
  useEffect(() => {
    loadLessons();
  }, [yearId]);

  const loadLessons = async () => {
    const result = await getLessons(yearId);
    if (result.success && result.data) {
      setLessons(result.data);
    }
  };

  // Create a new lesson
  const handleCreateLesson = async () => {
    startTransition(async () => {
      const result = await createLesson(yearId, "Untitled Lesson", {
        type: "doc",
        content: [],
      });
      if (result.success && result.data) {
        router.refresh();
        setEditingLesson(result.data);
        toast.success("Lesson created successfully");
      } else {
        toast.error(getUserFriendlyError(result.error));
      }
    });
  };

  // Delete a lesson
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    startTransition(async () => {
      const result = await deleteLesson(lessonId);
      if (result.success) {
        if (editingLesson?.id === lessonId) {
          setEditingLesson(null);
        }
        router.refresh();
        toast.success("Lesson deleted successfully");
      } else {
        toast.error(getUserFriendlyError(result.error));
      }
    });
  };

  // Auto-save functionality for title
  const handleTitleChange = (lessonId: string, newTitle: string) => {
    // Update local state immediately
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, title: newTitle } : lesson
      )
    );

    // Update editing lesson if it's the one being edited
    setEditingLesson((prev) =>
      prev?.id === lessonId ? { ...prev, title: newTitle } : prev
    );

    // Clear existing timeout for this lesson
    const existingTimeout = saveTimeoutsRef.current.get(lessonId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(async () => {
      setSavingLessons((prev) => new Set(prev).add(lessonId));

      // Get the current lesson data from ref
      const lesson = lessonsRef.current.find((l) => l.id === lessonId);
      if (lesson) {
        try {
          await updateLesson(
            lessonId,
            newTitle,
            (lesson.content as any) || { type: "doc", content: [] }
          );
        } catch (error) {
          console.error("Error saving lesson title:", error);
        } finally {
          setSavingLessons((prev) => {
            const newSet = new Set(prev);
            newSet.delete(lessonId);
            return newSet;
          });
        }
      }
    }, 1000);

    saveTimeoutsRef.current.set(lessonId, timeout);
  };

  // Auto-save functionality for content
  const handleContentChange = useCallback((lessonId: string, content: any) => {
    // Update local state immediately with new content
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, content: content as any } : lesson
      )
    );

    // Update editing lesson if it's the one being edited
    setEditingLesson((prev) =>
      prev?.id === lessonId ? { ...prev, content: content as any } : prev
    );

    // Clear existing timeout for this lesson
    const existingTimeout = saveTimeoutsRef.current.get(lessonId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(async () => {
      setSavingLessons((prev) => new Set(prev).add(lessonId));

      // Get the current lesson data from ref
      const lesson = lessonsRef.current.find((l) => l.id === lessonId);
      if (lesson) {
        try {
          const result = await updateLesson(lessonId, lesson.title, content);
        } catch (error) {
          console.error("Error saving lesson content:", error);
        } finally {
          setSavingLessons((prev) => {
            const newSet = new Set(prev);
            newSet.delete(lessonId);
            return newSet;
          });
        }
      }
    }, 1000);

    saveTimeoutsRef.current.set(lessonId, timeout);
  }, []);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-4">
        <div className="flex items-center justify-end">
          <Button
            onClick={handleCreateLesson}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Lesson
          </Button>
        </div>
      </div>

      {/* Card Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <p className="text-muted-foreground mb-4">
              No lessons yet. Start capturing your insights!
            </p>
            <Button onClick={handleCreateLesson} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create First Lesson
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="border border-border/60 rounded-lg bg-card shadow-sm hover-elevate cursor-pointer"
                onClick={() => setEditingLesson(lesson)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-serif font-semibold text-foreground flex-1 line-clamp-2 text-sm sm:text-base">
                      {lesson.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLesson(lesson.id);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground line-clamp-4 mb-2">
                    {/* Display plain text preview of content */}
                    {lesson.content &&
                    typeof lesson.content === "object" &&
                    "content" in lesson.content
                      ? (lesson.content as any).content
                          ?.map((node: any) =>
                            node.content
                              ?.map((textNode: any) => textNode.text || "")
                              .join("")
                          )
                          .join(" ") || "Empty lesson"
                      : "Empty lesson"}
                  </div>
                  <div className="text-xs text-muted-foreground/70 font-mono">
                    {formatDate(lesson.createdAt)}
                  </div>
                  {savingLessons.has(lesson.id) && (
                    <div className="text-xs text-primary mt-2">Saving...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OPTIMIZATION: Full-screen modal on mobile, centered on desktop */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="bg-card sm:rounded-lg shadow-xl w-full max-w-4xl h-full sm:h-[90vh] flex flex-col border border-border">
            {/* Modal Header */}
            <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
              <input
                type="text"
                value={editingLesson.title}
                onChange={(e) =>
                  handleTitleChange(editingLesson.id, e.target.value)
                }
                className="text-lg sm:text-2xl font-semibold border-none outline-none focus:ring-0 flex-1 min-w-0"
                placeholder="Lesson title..."
              />
              <Button
                onClick={() => setEditingLesson(null)}
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
                key={editingLesson.id}
                entityType="lesson"
                entityId={editingLesson.id}
                initialContent={
                  editingLesson.content || { type: "doc", content: [] }
                }
                highlights={(editingLesson as any).highlights || []}
                onContentChange={(content) =>
                  handleContentChange(editingLesson.id, content)
                }
                placeholder="What did you learn?"
              />
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-4 sm:px-6 py-3 flex items-center justify-between">
              <div className="text-xs sm:text-sm text-muted-foreground truncate font-mono">
                Created {formatDate(editingLesson.createdAt)}
              </div>
              {savingLessons.has(editingLesson.id) && (
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
