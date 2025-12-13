"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QuarterlyReflection } from "@prisma/client";
import { EditorWithPersistence } from "./editor";
import {
  getQuarterlyReflections,
  updateQuarterlyReflection,
} from "@/lib/actions";
// ... existing imports ...
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// REMOVED: Dialog imports
import {
  Calendar,
  CircleDashed,
  ChevronRight,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QuarterlyReflectionsProps {
  yearId: string;
  year: number;
  initialData?: QuarterlyReflection[];
}

const QUARTERS = [
  {
    number: 1,
    label: "Quarter 1",
    months: "Jan - Mar",
    color: "bg-emerald-50/50 border-emerald-100 hover:border-emerald-200",
    iconColor: "text-emerald-600",
  },
  {
    number: 2,
    label: "Quarter 2",
    months: "Apr - Jun",
    color: "bg-blue-50/50 border-blue-100 hover:border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    number: 3,
    label: "Quarter 3",
    months: "Jul - Sep",
    color: "bg-amber-50/50 border-amber-100 hover:border-amber-200",
    iconColor: "text-amber-600",
  },
  {
    number: 4,
    label: "Quarter 4",
    months: "Oct - Dec",
    color: "bg-rose-50/50 border-rose-100 hover:border-rose-200",
    iconColor: "text-rose-600",
  },
] as const;

export function QuarterlyReflections({
  yearId,
  year,
  initialData
}: QuarterlyReflectionsProps) {
  const [reflections, setReflections] = useState<QuarterlyReflection[]>(initialData || []);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Sync with server
  useEffect(() => {
    if (initialData) {
        setReflections(initialData);
    }
  }, [initialData]);

  const loadReflections = useCallback(async () => {
    // Deprecated: Using server props + router.refresh()
    router.refresh();
  }, [router]);

  // Helper to extract text preview from Tiptap JSON
  const getPreviewText = (content: any) => {
    if (!content || !content.content) return null;
    const text = content.content
      .map((node: any) => node.content?.map((t: any) => t.text).join(" ") || "")
      .join(" ");
    return text.length > 150 ? text.slice(0, 150) + "..." : text;
  };

  // Helper to determine status
  const getStatus = (reflection?: QuarterlyReflection) => {
    const hasContent =
      reflection?.content &&
      (reflection.content as any).content?.length > 0 &&
      getPreviewText(reflection.content);
    if (hasContent) return "In Progress";
    return "Not Started";
  };

  // Auto-save handler
  const handleContentChange = useCallback(
    (content: any) => {
      if (!selectedQuarter) return;

      // Optimistic update
      setReflections((prev) => {
        const existing = prev.find((r) => r.quarter === selectedQuarter);
        if (existing) {
          return prev.map((r) =>
            r.quarter === selectedQuarter ? { ...r, content } : r
          );
        }
        return prev;
      });

      if (saveTimeout) clearTimeout(saveTimeout);

      const timeout = setTimeout(async () => {
        setIsSaving(true);
        const result = await updateQuarterlyReflection(
          yearId,
          selectedQuarter,
          content
        );
        if (result.success) {
          await loadReflections();
        }
        setIsSaving(false);
      }, 1000);

      setSaveTimeout(timeout);
    },
    [yearId, selectedQuarter, saveTimeout]
  );

  const activeReflection = reflections.find(
    (r) => r.quarter === selectedQuarter
  );

  const activeQuarterMeta = QUARTERS.find(q => q.number === selectedQuarter);
  const isEditing = selectedQuarter !== null;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 relative">
      <div className={cn("transition-all duration-500", isEditing ? "opacity-20 blur-sm pointer-events-none" : "opacity-100")}>
        {/* Header */}
        <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground tracking-tight">
            Quarterly Reflections
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
            Four strategic checkpoints to align your year.
            </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {QUARTERS.map((q) => {
            const reflection = reflections.find((r) => r.quarter === q.number);
            const status = getStatus(reflection);
            const preview = getPreviewText(reflection?.content);

            return (
                <Card
                key={q.number}
                onClick={() => setSelectedQuarter(q.number)}
                className={cn(
                    "group cursor-pointer transition-all duration-300 hover:shadow-md border-2",
                    q.color
                )}
                >
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="font-serif text-2xl flex items-center gap-3">
                        {q.label}
                        {status === "In Progress" && (
                            <CircleDashed
                            className={cn("w-5 h-5 animate-pulse", q.iconColor)}
                            />
                        )}
                        {status === "Not Started" && (
                            <PenLine className="w-4 h-4 text-muted-foreground/50" />
                        )}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {q.months}
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-background/50 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="min-h-[80px] flex flex-col justify-center">
                    {preview ? (
                        <p className="text-foreground/80 leading-relaxed font-serif line-clamp-3">
                        {preview}
                        </p>
                    ) : (
                        <div className="text-center text-muted-foreground/60 italic flex flex-col items-center gap-2">
                            <span>Tap to start writing...</span>
                        </div>
                    )}
                    </div>
                    <div className="mt-4 flex justify-end">
                    <Badge
                        variant="secondary"
                        className="bg-background/60 backdrop-blur-sm"
                    >
                        {status === "In Progress"
                        ? "Continue Writing"
                        : "Start Reflection"}
                    </Badge>
                    </div>
                </CardContent>
                </Card>
            );
            })}
        </div>
      </div>

      {/* ZEN EDITOR OVERLAY */}
      <AnimatePresence>
        {isEditing && activeQuarterMeta && (
           <motion.div
             key="quarter-zen-editor"
             initial={{ opacity: 0, y: 50, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 50, scale: 0.95 }}
             transition={{ duration: 0.3 }}
             className="fixed inset-0 z-50 bg-background overflow-y-auto p-4 sm:p-12 md:p-20"
           >
             <div className="max-w-4xl mx-auto h-full flex flex-col">
                {/* Header/Close Button */}
                <div className="flex justify-between items-center mb-8 shrink-0">
                    <div>
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900">
                         {activeQuarterMeta.label}
                        </h2>
                         <p className="text-sm text-muted-foreground mt-1">
                            {activeQuarterMeta.months} • {year}
                         </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {isSaving ? (
                            <span className="text-xs text-muted-foreground animate-pulse">
                            Saving...
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">Saved</span>
                        )}
                        <Button
                            onClick={() => setSelectedQuarter(null)}
                            className="rounded-full shadow-lg"
                        >
                            Done Reflecting
                        </Button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-8">
                  <div className="max-w-3xl mx-auto">
                    <EditorWithPersistence
                        key={`q${selectedQuarter}-editor`}
                        entityType="quarterlyReflection"
                        entityId={
                            activeReflection?.id ||
                            `${yearId}-q${selectedQuarter}-temp`
                        }
                        initialContent={
                            activeReflection?.content || {
                            type: "doc",
                            content: [],
                            }
                        }
                        highlights={(activeReflection as any)?.highlights || []}
                        onContentChange={handleContentChange}
                        placeholder={`Reflect on ${activeQuarterMeta.label}. What were your biggest wins? Challenges?`}
                        variant="minimal"
                        className="prose-xl"
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
