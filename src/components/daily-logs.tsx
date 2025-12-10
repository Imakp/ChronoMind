"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DailyLog } from "@prisma/client";
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
  getDailyLogs,
} from "@/lib/actions";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

interface DailyLogsProps {
  yearId: string;
  year: number;
}

export function DailyLogs({ yearId, year }: DailyLogsProps) {
  // State
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
  const [isLoadingLog, setIsLoadingLog] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Derived State
  const isDateToday = isToday(currentDate);
  const isDateFuture = isFuture(currentDate);

  // Helper to check if a log has meaningful content
  const hasContent = (log?: DailyLog | null) => {
    if (!log || !log.content) return false;
    const content = log.content as any;
    // Simple check: if it has text or multiple blocks
    if (content.content?.length > 1) return true;
    if (content.content?.[0]?.content) return true;
    return false;
  };

  const currentLogHasContent = hasContent(selectedLog);

  // Load all logs index on mount
  useEffect(() => {
    const loadLogsIndex = async () => {
      const result = await getDailyLogs(yearId);
      if (result.success && result.data) {
        setLogs(result.data);
      }
    };
    loadLogsIndex();
  }, [yearId]);

  // Fetch/Create log when date changes
  useEffect(() => {
    const fetchLogForDate = async () => {
      setIsLoadingLog(true);
      // Check local cache first
      const cachedLog = logs.find((l) =>
        isSameDay(new Date(l.date), currentDate)
      );
      if (cachedLog) {
        setSelectedLog(cachedLog);
        setIsLoadingLog(false);
        return;
      }

      // If not in cache and not future, fetch/create from server
      if (!isDateFuture) {
        const result = await getOrCreateDailyLog(yearId, currentDate);
        if (result.success && result.data) {
          setSelectedLog(result.data);
          // Add to local cache if new
          setLogs((prev) => {
            if (prev.find((l) => l.id === result.data!.id)) return prev;
            return [...prev, result.data!];
          });
        }
      } else {
        setSelectedLog(null);
      }
      setIsLoadingLog(false);
    };

    fetchLogForDate();
  }, [currentDate, yearId, isDateFuture]); // Removed logs from dependency to prevent loop

  // Navigation Handlers
  const handlePrevDay = () => setCurrentDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate((prev) => addDays(prev, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  // Auto-save
  const handleContentChange = useCallback(
    (content: any) => {
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
    .filter((l) => hasContent(l))
    .map((l) => new Date(l.date));

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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
                isSameDay(new Date(l.date), day)
              );
              const isFilled = hasContent(logForDay);
              const isSelected = isSameDay(day, currentDate);
              const isFut = isFuture(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setCurrentDate(day)}
                  disabled={isFut && !isSameDay(day, new Date())} // Allow clicking future only if it's "today" (edge case)
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
                You're ahead of time
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                You can't log memories that haven't happened yet. Use the Goals
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
                You didn't log anything for {format(currentDate, "MMMM do")}.
                It's never too late to backfill a quick summary.
              </AlertDescription>
            </Alert>
            <div className="opacity-80 transition-opacity duration-300 hover:opacity-100 focus-within:opacity-100">
              <EditorWithPersistence
                key={selectedLog.id}
                entityType="dailyLog"
                entityId={selectedLog.id}
                initialContent={
                  selectedLog.content || { type: "doc", content: [] }
                }
                highlights={(selectedLog as any).highlights || []}
                onContentChange={handleContentChange}
                placeholder="Backfill your memory... What happened on this day?"
              />
            </div>
          </div>
        ) : selectedLog ? (
          <div className="relative group">
            {/* Saving Indicator */}
            <div className="absolute -top-12 right-0 flex items-center gap-2 text-xs text-muted-foreground transition-opacity duration-500">
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
            <EditorWithPersistence
              key={selectedLog.id}
              entityType="dailyLog"
              entityId={selectedLog.id}
              initialContent={
                selectedLog.content || { type: "doc", content: [] }
              }
              highlights={(selectedLog as any).highlights || []}
              onContentChange={handleContentChange}
              placeholder="What's on your mind today? Highlight text to tag it..."
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
