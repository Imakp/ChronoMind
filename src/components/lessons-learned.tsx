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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Lightbulb,
  Quote,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handler";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LessonsLearnedProps {
  yearId: string;
  year: number;
}

// Pastel color palette for cards
const CARD_COLORS = [
  "bg-amber-50 border-amber-200 hover:border-amber-300",
  "bg-blue-50 border-blue-200 hover:border-blue-300",
  "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
  "bg-rose-50 border-rose-200 hover:border-rose-300",
  "bg-purple-50 border-purple-200 hover:border-purple-300",
];

const getLessonColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
};

export function LessonsLearned({ yearId, year }: LessonsLearnedProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [savingLessons, setSavingLessons] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const saveTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lessonsRef = useRef<Lesson[]>([]);

  useEffect(() => {
    lessonsRef.current = lessons;
  }, [lessons]);

  useEffect(() => {
    loadLessons();
  }, [yearId]);

  const loadLessons = async () => {
    const result = await getLessons(yearId);
    if (result.success && result.data) {
      setLessons(result.data);
    }
  };

  const handleCreateLesson = async () => {
    startTransition(async () => {
      const result = await createLesson(yearId, "New Insight", {
        type: "doc",
        content: [],
      });
      if (result.success && result.data) {
        router.refresh();
        setLessons([result.data, ...lessons]);
        setEditingLesson(result.data);
        toast.success("Insight captured");
      } else {
        toast.error(getUserFriendlyError(result.error));
      }
    });
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Forget this lesson?")) return;
    startTransition(async () => {
      const result = await deleteLesson(lessonId);
      if (result.success) {
        if (editingLesson?.id === lessonId) setEditingLesson(null);
        setLessons(lessons.filter((l) => l.id !== lessonId));
        router.refresh();
        toast.success("Lesson deleted");
      }
    });
  };

  const handleTitleChange = (lessonId: string, newTitle: string) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, title: newTitle } : l))
    );

    if (editingLesson?.id === lessonId) {
      setEditingLesson((prev) => (prev ? { ...prev, title: newTitle } : null));
    }

    const existingTimeout = saveTimeoutsRef.current.get(lessonId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(async () => {
      setSavingLessons((prev) => new Set(prev).add(lessonId));
      const lesson = lessonsRef.current.find((l) => l.id === lessonId);
      if (lesson) {
        await updateLesson(lessonId, newTitle, lesson.content as any);
        setSavingLessons((prev) => {
          const newSet = new Set(prev);
          newSet.delete(lessonId);
          return newSet;
        });
      }
    }, 1000);

    saveTimeoutsRef.current.set(lessonId, timeout);
  };

  const handleContentChange = useCallback((lessonId: string, content: any) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId ? { ...l, content: content as any } : l
      )
    );

    const existingTimeout = saveTimeoutsRef.current.get(lessonId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(async () => {
      setSavingLessons((prev) => new Set(prev).add(lessonId));
      const lesson = lessonsRef.current.find((l) => l.id === lessonId);
      if (lesson) {
        await updateLesson(lessonId, lesson.title, content);
        setSavingLessons((prev) => {
          const newSet = new Set(prev);
          newSet.delete(lessonId);
          return newSet;
        });
      }
    }, 1000);

    saveTimeoutsRef.current.set(lessonId, timeout);
  }, []);

  const getPreviewText = (content: any) => {
    if (!content || !content.content) return "No details added yet...";
    return content.content
      .map((node: any) => node.content?.map((t: any) => t.text).join(" ") || "")
      .join(" ");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium text-foreground tracking-tight">
            Lessons Learned
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Distilled wisdom and principles from your experiences in {year}.
          </p>
        </div>
        <Button onClick={handleCreateLesson} size="lg" className="shadow-sm">
          <Lightbulb className="w-4 h-4 mr-2" />
          Capture Insight
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {lessons.map((lesson, i) => {
            const colorClass = getLessonColor(lesson.id);
            const preview = getPreviewText(lesson.content);
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setEditingLesson(lesson)}
              >
                <Card
                  className={cn(
                    "h-full cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-l-4",
                    colorClass
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant="secondary"
                        className="bg-white/50 hover:bg-white/80 font-mono text-xs text-muted-foreground backdrop-blur-sm"
                      >
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLesson(lesson.id);
                        }}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <Quote className="w-8 h-8 text-foreground/10 flex-shrink-0 -mt-1" />
                      <CardTitle className="font-serif text-xl leading-tight text-foreground line-clamp-3">
                        {lesson.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="pl-11">
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 border-l-2 border-foreground/10 pl-3">
                        {preview}
                      </p>
                      <div className="mt-4 flex items-center text-xs font-medium text-foreground/40 group-hover:text-primary transition-colors">
                        Read more <ArrowRight className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {lessons.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border/50 rounded-xl bg-secondary/5">
            <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No lessons recorded yet.</p>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <Dialog
        open={!!editingLesson}
        onOpenChange={(open) => !open && setEditingLesson(null)}
      >
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0">
          {editingLesson && (
            <>
              <div
                className={cn(
                  "border-b px-6 py-4 flex flex-col gap-2 shrink-0",
                  getLessonColor(editingLesson.id).split(" ")[0]
                )}
              >
                <input
                  value={editingLesson.title}
                  onChange={(e) =>
                    handleTitleChange(editingLesson.id, e.target.value)
                  }
                  className="bg-transparent text-2xl font-serif font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
                  placeholder="The Core Principle..."
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(editingLesson.createdAt).toLocaleDateString(
                      undefined,
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>
                  {savingLessons.has(editingLesson.id) ? (
                    <span className="animate-pulse text-primary">
                      Saving...
                    </span>
                  ) : (
                    <span>Saved</span>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-background/50">
                <EditorWithPersistence
                  key={editingLesson.id}
                  entityType="lesson"
                  entityId={editingLesson.id}
                  initialContent={editingLesson.content}
                  onContentChange={(content) =>
                    handleContentChange(editingLesson.id, content)
                  }
                  placeholder="Elaborate on this lesson. What triggered it? How will you apply it?"
                  highlights={(editingLesson as any).highlights || []}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
