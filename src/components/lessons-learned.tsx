"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

interface LessonsLearnedProps {
  yearId: string;
  year: number;
}

export function LessonsLearned({ yearId }: LessonsLearnedProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [savingLessons, setSavingLessons] = useState<Set<string>>(new Set());

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
    setIsLoading(true);
    const result = await getLessons(yearId);
    if (result.success && result.data) {
      setLessons(result.data);
    }
    setIsLoading(false);
  };

  // Create a new lesson
  const handleCreateLesson = async () => {
    const result = await createLesson(yearId, "Untitled Lesson", {
      type: "doc",
      content: [],
    });
    if (result.success && result.data) {
      setLessons((prev) => [result.data, ...prev]);
      setEditingLesson(result.data);
    }
  };

  // Delete a lesson
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    const result = await deleteLesson(lessonId);
    if (result.success) {
      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
      if (editingLesson?.id === lessonId) {
        setEditingLesson(null);
      }
    }
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
      console.log("Cleared previous title save timeout");
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(async () => {
      console.log("Saving title after 1 second of inactivity...");
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
          console.log("Title saved successfully");
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
    console.log("Content change triggered - debouncing...");

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
      console.log("Cleared previous timeout - resetting 1 second timer");
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(async () => {
      console.log("1 second passed - saving content now...");
      setSavingLessons((prev) => new Set(prev).add(lessonId));

      // Get the current lesson data from ref
      const lesson = lessonsRef.current.find((l) => l.id === lessonId);
      if (lesson) {
        try {
          const result = await updateLesson(lessonId, lesson.title, content);
          console.log("Content saved successfully:", result);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading lessons...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Lessons Learned</h2>
          <Button onClick={handleCreateLesson} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Lesson
          </Button>
        </div>
      </div>

      {/* Card Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-gray-500 mb-4">
              No lessons yet. Start capturing your insights!
            </p>
            <Button onClick={handleCreateLesson}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Lesson
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setEditingLesson(lesson)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1 line-clamp-2">
                      {lesson.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLesson(lesson.id);
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-4 mb-2">
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
                  <div className="text-xs text-gray-400">
                    {formatDate(lesson.createdAt)}
                  </div>
                  {savingLessons.has(lesson.id) && (
                    <div className="text-xs text-blue-600 mt-2">Saving...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen editor modal */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <input
                type="text"
                value={editingLesson.title}
                onChange={(e) =>
                  handleTitleChange(editingLesson.id, e.target.value)
                }
                className="text-2xl font-semibold border-none outline-none focus:ring-0 flex-1"
                placeholder="Lesson title..."
              />
              <Button
                onClick={() => setEditingLesson(null)}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <EditorWithPersistence
                key={editingLesson.id}
                entityType="lesson"
                entityId={editingLesson.id}
                initialContent={
                  editingLesson.content || { type: "doc", content: [] }
                }
                onContentChange={(content) =>
                  handleContentChange(editingLesson.id, content)
                }
                placeholder="What did you learn?"
              />
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Created {formatDate(editingLesson.createdAt)}
              </div>
              {savingLessons.has(editingLesson.id) && (
                <div className="text-sm text-blue-600">Saving...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
