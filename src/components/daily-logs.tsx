"use client";

import { useState, useEffect, useCallback } from "react";
import { DailyLog } from "@prisma/client";
import type { DailyLogWithRelations, TiptapContent } from "@/types";
import {
  format,
  addDays,
  subDays,
  isSameDay,
  isFuture,
  isToday,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  History,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { EditorWithPersistence } from "./editor/editor-with-persistence";
import {
  getOrCreateDailyLog,
  updateDailyLog,
} from "@/lib/actions";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { cn } from "@/lib/utils";

interface DailyLogsProps {
  yearId: string;
  year: number;
  initialLogs: Partial<DailyLog>[]; // Logs from list fetch might not have content
  todayLog: DailyLog | null;
}

export function DailyLogs({ yearId, initialLogs, todayLog }: DailyLogsProps) {
  // State
  // Merge initialLogs with todayLog if it's not in the list (it should be if list is fresh, but just in case)
  const [logs, setLogs] = useState<Partial<DailyLog>[]>(() => {
    if (todayLog && !initialLogs.find(l => l.id === todayLog.id)) {
      return [todayLog, ...initialLogs];
    }
    return initialLogs;
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Initialize selectedLog with todayLog if dates match, otherwise null or find from logs
  const [selectedLog, setSelectedLog] = useState<DailyLogWithRelations | null>(() => {
    if (isSameDay(new Date(), currentDate) && todayLog) return todayLog as unknown as DailyLogWithRelations;
    return null;
  });

  const [isLoadingLog, setIsLoadingLog] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Derived State
  const isDateToday = isToday(currentDate);
  const isDateFuture = isFuture(currentDate);

  // Helper to check if a log has meaningful content
  const hasContent = (log?: Partial<DailyLog> | null) => {
    if (!log || !log.content) return false;
    if (!log || !log.content) return false;
    const content = log.content as unknown as TiptapContent;
    // Simple check: if it has text or multiple blocks
    if ((content.content?.length || 0) > 1) return true;
    if (content.content?.[0]?.content) return true;
    return false;
  };

  const currentLogHasContent = hasContent(selectedLog);

  // NOTE: Initial fetch removed (Plan Phase 1)

  // Fetch/Create log when date changes
  useEffect(() => {
    const fetchLogForDate = async () => {
      setIsLoadingLog(true);
      // Check local cache first
      // We seek a log that has CONTENT (since list logs might have empty content placeholder)
      // Actually, if we selected the log previously, we have it in `logs` with content.
      // But the initial `logs` from server MISS content.
      // So we must fetch if the log in `state` doesn't have content loaded.
      
      const cachedLog = logs.find((l) =>
        isSameDay(new Date(l.date!), currentDate)
      );

      // If cached log has content (it was fully fetched or is todayLog), use it.
      if (cachedLog && (cachedLog as unknown as DailyLogWithRelations).content) {
        setSelectedLog(cachedLog as unknown as DailyLogWithRelations);
        setIsLoadingLog(false);
        return;
      }

      // If not in cache or missing content, and not future, fetch/create from server
      if (!isDateFuture) {
        // Use getOrCreateDailyLog which returns the FULL log
        const result = await getOrCreateDailyLog(yearId, currentDate);
        if (result.success && result.data) {
          setSelectedLog(result.data as unknown as DailyLogWithRelations);
          // Update local cache with the FULL log
          setLogs((prev) => {
            const existingIndex = prev.findIndex((l) => l.id === result.data!.id);
            if (existingIndex >= 0) {
              const newLogs = [...prev];
              newLogs[existingIndex] = result.data!;
              return newLogs;
            }
            return [...prev, result.data!];
          });
        }
      } else {
        setSelectedLog(null);
      }
      setIsLoadingLog(false);
    };

    fetchLogForDate();
  }, [currentDate, yearId, isDateFuture, logs]); 

  // Navigation Handlers
  const handlePrevDay = () => setCurrentDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate((prev) => addDays(prev, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  // Auto-save
  const handleContentChange = useCallback(
    (content: TiptapContent) => {
      if (!selectedLog) return;

      // Optimistic local update
      setSelectedLog((prev) => (prev ? { ...prev, content } : null));

      // Update logs array to reflect "filled" state immediately in UI
      setLogs((prev) =>
        prev.map((l) => (l.id === selectedLog.id ? { ...l, content } : l))
      );

      if (saveTimeout) clearTimeout(saveTimeout);

      const timeout = setTimeout(async () => {
        setIsSaving(true);
        await updateDailyLog(selectedLog.id, content);
        setIsSaving(false);
      }, 1000);

      setSaveTimeout(timeout);
    },
    [selectedLog, saveTimeout]
  );

  // Week Strip Calculation
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Calendar Modifiers
  const filledDates = logs
    .filter((l) => l.date && hasContent(l))
    .map((l) => new Date(l.date!));

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* 1. Header & Navigation */}
      <div 
         className={cn(
            "flex flex-col md:flex-row md:items-end justify-between gap-6 transition-all duration-700",
            isFocused ? "opacity-10 blur-[2px] pointer-events-none grayscale" : "opacity-100"
         )}
      >
        <div>
          <h2 className="font-serif text-3xl font-medium text-foreground flex items-center gap-3">
            Daily Log
            {isDateToday && (
              <Badge
                variant="secondary"
                className="font-sans text-xs font-normal"
              >
                Today
              </Badge>
            )}
            {isDateFuture && (
              <Badge
                variant="outline"
                className="font-sans text-xs font-normal text-muted-foreground"
              >
                Future
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Capture your thoughts, one day at a time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Desktop Week Strip */}
          <div className="hidden lg:flex bg-secondary/30 rounded-lg p-1 mr-2 border border-border/50">
            {weekDays.map((day) => {
              const logForDay = logs.find((l) =>
                l.date && isSameDay(new Date(l.date), day)
              );
              // Note: If content is missing (from initial list), dot might not show. 
              // We accept this trade-off for performance, or user clicks to load.
              // Ideally server sends a boolean 'hasContent'.
              const isFilled = hasContent(logForDay);
              const isSelected = isSameDay(day, currentDate);
              const isFut = isFuture(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setCurrentDate(day)}
                  disabled={isFut && !isSameDay(day, new Date())} 
                  className={cn(
                    "w-10 h-10 rounded-md flex flex-col items-center justify-center text-[10px] font-medium transition-all relative",
                    isSelected
                      ? "bg-background shadow-sm text-foreground ring-1 ring-border"
                      : "text-muted-foreground hover:bg-background/50",
                    isFut && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <span className="opacity-70 text-[9px] uppercase tracking-wider">
                    {format(day, "EEE")}
                  </span>
                  <span className="text-xs">{format(day, "d")}</span>
                  {isFilled && !isFut && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary/60" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Navigator */}
          <div className="flex items-center justify-between w-full sm:w-auto bg-card p-1 rounded-lg border border-border shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevDay}
              className="h-9 w-9"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 min-w-[140px] justify-center font-mono text-sm hover:bg-secondary/50 rounded-md transition-colors",
                    isDateToday && "text-primary font-semibold"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 opacity-70" />
                  {format(currentDate, "MMM do, yyyy")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(d) => {
                    if (d) {
                      setCurrentDate(d);
                      setIsCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  modifiers={{ filled: filledDates }}
                  modifiersStyles={{
                    filled: {
                      fontWeight: "bold",
                      textDecoration: "underline",
                      textDecorationColor: "var(--primary)",
                      textUnderlineOffset: "4px",
                    },
                  }}
                  disabled={(date) => isFuture(date)}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextDay}
              className="h-9 w-9"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {!isDateToday && (
            <Button
              variant="ghost"
              size="sm"
              onClick={jumpToToday}
              className="hidden sm:flex text-xs h-9"
            >
              Jump to Today
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* 2. Content Area */}
      <div className="min-h-[60vh] relative">
        {isLoadingLog ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Retrieving memory...
            </p>
          </div>
        ) : isDateFuture ? (
          <div className="absolute inset-0 z-10 flex items-start pt-20 justify-center">
            <div className="text-center max-w-md p-8 border border-border bg-card/50 backdrop-blur-sm shadow-sm rounded-xl">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-2xl font-medium mb-3">
                You&apos;re ahead of time
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                You can&apos;t log memories that haven&apos;t happened yet. Use the Goals
                section to plan ahead, or wait for the future to arrive.
              </p>
              <Button onClick={jumpToToday} variant="outline">
                Return to Today
              </Button>
            </div>
          </div>
        ) : selectedLog && !currentLogHasContent && !isDateToday ? (
          <div className="space-y-6">
            <Alert className="bg-amber-50/50 border-amber-200/60 dark:bg-amber-950/10 dark:border-amber-900/30">
              <History className="h-4 w-4 text-amber-600/80" />
              <AlertTitle className="text-amber-800 dark:text-amber-500 font-medium">
                Missed Entry
              </AlertTitle>
              <AlertDescription className="text-amber-700/80 dark:text-amber-400/80 mt-1">
                You didn&apos;t log anything for {format(currentDate, "MMMM do")}.
                It&apos;s never too late to backfill a quick summary.
              </AlertDescription>
            </Alert>
            <div 
               className={cn(
                  "opacity-90 transition-all duration-500 rounded-xl p-6 md:p-10",
                  isFocused 
                    ? "scale-[1.01] shadow-xl bg-background z-20 ring-1 ring-black/5" 
                    : "scale-100 hover:bg-secondary/10"
               )}
               onFocus={() => setIsFocused(true)}
            >
              <EditorWithPersistence
                key={selectedLog.id} // CRITICAL: Reset editor when switching logs
                entityType="dailyLog"
                entityId={selectedLog.id}
                initialContent={
                  selectedLog.content || { type: "doc", content: [] }
                }
                highlights={selectedLog.highlights || []}
                onContentChange={handleContentChange}
                placeholder="Backfill your memory... What happened on this day?"
                variant="minimal"
                className="prose-lg"
              />
              {isFocused && (
                 <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-4 duration-500 z-50">
                    <Button 
                      className="shadow-lg rounded-full px-6"
                      size="lg"
                      onClick={() => setIsFocused(false)}
                    >
                      Done Writing
                    </Button>
                 </div>
              )}
            </div>
          </div>
        ) : selectedLog ? (
          <div className="relative group perspective-1000">
             {/* Header Dimmer Overlay */}
             {isFocused && (
                <div 
                  className="fixed inset-0 bg-background/80 backdrop-blur-[2px] z-10 animate-in fade-in duration-700"
                  onClick={() => setIsFocused(false)}
                />
             )}

            <div 
               className={cn(
                  "transition-all duration-700 ease-out origin-center relative",
                  isFocused 
                    ? "scale-[1.02] bg-background z-20 min-h-[70vh] py-12" 
                    : "scale-100",
                  !isFocused && "hover:bg-secondary/5 rounded-xl border border-transparent hover:border-border/40 p-4 -mx-4"
               )}
               onFocus={() => !isFocused && setIsFocused(true)}
            >
                {/* Saving Indicator */}
                <div className={cn(
                   "flex items-center gap-2 text-xs text-muted-foreground transition-all duration-500 absolute top-0 right-0 p-4",
                   isFocused ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {isSaving ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                    </span>
                  ) : (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Saved
                    </span>
                  )}
                </div>

                <div className="max-w-3xl mx-auto">
                   <div className={cn(
                      "mb-8 text-center transition-all duration-700 delay-100",
                       isFocused ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 hidden"
                   )}>
                      <p className="font-serif text-2xl text-foreground/80">
                         {format(currentDate, "EEEE, MMMM do")}
                      </p>
                   </div>

                   <EditorWithPersistence
                     key={selectedLog.id} // CRITICAL: Reset editor when switching logs
                     entityType="dailyLog"
                     entityId={selectedLog.id}
                     initialContent={
                       selectedLog.content || { type: "doc", content: [] }
                     }
                     highlights={selectedLog.highlights || []}
                     onContentChange={handleContentChange}
                     placeholder="What's on your mind today? Highlight text to tag it..."
                     variant="minimal"
                     className="prose-lg"
                   />
                </div>
            </div>

            {isFocused && (
                 <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-4 duration-500 z-50">
                    <Button 
                      className="shadow-lg rounded-full px-6 h-12"
                      onClick={() => setIsFocused(false)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Done Writing
                    </Button>
                 </div>
              )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
