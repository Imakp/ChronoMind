"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lesson } from "@prisma/client";
import { TiptapContent } from "@/types";
import { EditorWithPersistence } from "./editor";
import {
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/lib/actions";
// ... existing imports ...
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// REMOVED: Dialog imports
import {
  Trash2,
  Lightbulb,
  Quote,
  Calendar,
  ArrowRight,
  ArrowLeft, // Add ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handler";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LessonsLearnedProps {
  yearId: string;
  year: number;
  initialData?: Lesson[];
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

export function LessonsLearned({ yearId, year, initialData }: LessonsLearnedProps) {
  const [lessons, setLessons] = useState<Lesson[]>(initialData || []);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [savingLessons, setSavingLessons] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const router = useRouter();
  const saveTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lessonsRef = useRef<Lesson[]>([]);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  // Sync with server updates (derived state pattern)
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    if (initialData) {
      setLessons(initialData);
    }
  }

  useEffect(() => {
    lessonsRef.current = lessons;
  }, [lessons]);

  // Sync with server updates




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
        await updateLesson(lessonId, newTitle, lesson.content as unknown as TiptapContent);
        setSavingLessons((prev) => {
          const newSet = new Set(prev);
          newSet.delete(lessonId);
          return newSet;
        });
      }
    }, 1000);

    saveTimeoutsRef.current.set(lessonId, timeout);
  };

  const handleContentChange = useCallback((lessonId: string, content: TiptapContent) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId ? { ...l, content: content as unknown as Lesson["content"] } : l
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

  const getPreviewText = (content: Lesson["content"]) => {
    const typedContent = content as unknown as TiptapContent;
    if (!typedContent || !typedContent.content) return "No details added yet...";
    return typedContent.content
      .map((node: TiptapContent) => node.content?.map((t: TiptapContent) => t.text).join(" ") || "")
      .join(" ");
  };

  const isEditing = !!editingLesson;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 relative">
      <div className={cn("transition-all duration-500", isEditing ? "opacity-20 blur-sm pointer-events-none" : "opacity-100")}>
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
        <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
        >
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
        </motion.div>
      </div>

      {/* ZEN EDITOR OVERLAY */}
      <AnimatePresence>
        {isEditing && editingLesson && (
          <motion.div
            key="lesson-zen-editor"
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
                        onClick={() => setEditingLesson(null)}
                        className="rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900">
                    Lesson Learned
                    </h2>
                </div>
                 <div className="flex items-center gap-4">
                     {savingLessons.has(editingLesson.id) ? (
                        <span className="animate-pulse text-xs font-mono text-muted-foreground">
                        Saving...
                        </span>
                    ) : (
                        <span className="text-xs font-mono text-muted-foreground">Saved</span>
                    )}
                    <Button
                        onClick={() => setEditingLesson(null)}
                        className="rounded-full shadow-lg"
                    >
                        Done Learning
                    </Button>
                 </div>
              </div>

               {/* Title Input */}
               <div className="max-w-3xl mx-auto w-full mb-6">
                 <input
                    value={editingLesson.title}
                    onChange={(e) =>
                    handleTitleChange(editingLesson.id, e.target.value)
                    }
                    className="w-full bg-transparent text-4xl font-serif font-bold text-foreground outline-none placeholder:text-muted-foreground/50 border-b border-transparent focus:border-border pb-2 transition-colors"
                    placeholder="The Core Principle..."
                  />
                  <div className="mt-2 flex items-center text-sm text-muted-foreground">
                         <Calendar className="w-4 h-4 mr-2" />
                         {new Date(editingLesson.createdAt).toLocaleDateString(undefined, {
                             weekday: 'long',
                             year: 'numeric',
                             month: 'long',
                             day: 'numeric'
                         })}
                  </div>
               </div>

              {/* Editor Area */}
              <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-8">
                <div className="max-w-3xl mx-auto">
                  <EditorWithPersistence
                    key={editingLesson.id}
                    entityType="lesson"
                    entityId={editingLesson.id}
                    initialContent={
                      editingLesson.content
                        ? (editingLesson.content as unknown as TiptapContent)
                        : undefined
                    }
                    onContentChange={(c) => handleContentChange(editingLesson.id, c)}
                    placeholder="Detail your insight..."
                    variant="minimal"
                    className="prose-lg"
                    highlights={[]}
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
