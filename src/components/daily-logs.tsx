"use client";

import { useState, useEffect, useCallback } from "react";
import { DailyLog } from "@prisma/client";
import { EditorWithPersistence } from "./editor";
import {
  getOrCreateDailyLog,
  updateDailyLog,
  getDailyLogs,
} from "@/lib/actions";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DailyLogsProps {
  yearId: string;
  year: number;
}

export function DailyLogs({ yearId, year }: DailyLogsProps) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load all logs for the year
  useEffect(() => {
    loadLogs();
  }, [yearId]);

  const loadLogs = async () => {
    setIsLoading(true);
    const result = await getDailyLogs(yearId);
    if (result.success && result.data) {
      setLogs(result.data);
      // Auto-select today's log or the most recent one
      if (result.data.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLog = result.data.find(
          (log) => new Date(log.date).getTime() === today.getTime()
        );
        setSelectedLog(todayLog || result.data[0]);
      }
    }
    setIsLoading(false);
  };

  // Get or create a daily log for a specific date
  const handleDateSelect = async (date: Date) => {
    // 1. Normalize date to midnight in local timezone
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const normalizedTime = normalizedDate.getTime();

    // 2. Check local state (logs) first to avoid unnecessary server calls
    const existingLocalLog = logs.find(
      (log) => new Date(log.date).getTime() === normalizedTime
    );

    if (existingLocalLog) {
      // If found locally, select it and return immediately
      setSelectedLog(existingLocalLog);
      return;
    }

    // 3. If not found locally, call the server action (which will fetch or create)
    const result = await getOrCreateDailyLog(yearId, normalizedDate);
    if (result.success && result.data) {
      setSelectedLog(result.data);
      // Update logs list only if the log was not present locally
      const existingLogOnServerReturn = logs.find(
        (log) => new Date(log.date).getTime() === normalizedTime
      );
      if (!existingLogOnServerReturn) {
        setLogs((prev) =>
          [result.data, ...prev].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      }
    }
  };

  // Navigate to previous day
  const handlePreviousDay = () => {
    if (!selectedLog) return;
    const currentDate = new Date(selectedLog.date);
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 1);
    handleDateSelect(previousDate);
  };

  // Navigate to next day
  const handleNextDay = () => {
    if (!selectedLog) return;
    const currentDate = new Date(selectedLog.date);
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    handleDateSelect(nextDate);
  };

  // Navigate to today
  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    handleDateSelect(today);
  };

  // Auto-save functionality
  const handleContentChange = useCallback(
    (content: any) => {
      if (!selectedLog) return;

      // Update the selected log's content immediately in local state
      setSelectedLog((prev) => (prev ? { ...prev, content } : null));

      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set new timeout for auto-save
      const timeout = setTimeout(async () => {
        setIsSaving(true);
        const result = await updateDailyLog(selectedLog.id, content);
        if (result.success && result.data) {
          // Update the log in the logs array
          setLogs((prev) =>
            prev.map((log) => (log.id === selectedLog.id ? result.data : log))
          );
        }
        setIsSaving(false);
      }, 1000); // Save after 1 second of inactivity

      setSaveTimeout(timeout);
    },
    [selectedLog, saveTimeout]
  );

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format date for mobile (shorter)
  const formatDateMobile = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            aria-hidden="true"
          ></div>
          <div className="text-gray-500">Loading daily logs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* OPTIMIZATION: Desktop sidebar - hidden on mobile, visible at md+ */}
      <nav
        className="hidden md:block w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto"
        aria-label="Daily logs navigation"
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4" id="daily-logs-heading">
            Daily Logs
          </h2>
          <Button
            onClick={handleToday}
            variant="outline"
            size="sm"
            className="w-full mb-4"
            aria-label="Jump to today's log"
          >
            <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
            Today
          </Button>
          <div
            className="space-y-1"
            role="list"
            aria-labelledby="daily-logs-heading"
          >
            {logs.map((log) => (
              <button
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedLog?.id === log.id
                    ? "bg-blue-100 text-blue-900 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                role="listitem"
                aria-label={`Log for ${new Date(log.date).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}`}
                aria-current={selectedLog?.id === log.id ? "page" : undefined}
              >
                {new Date(log.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* OPTIMIZATION: Mobile navigation header - only visible below md */}
        {selectedLog && (
          <div className="md:hidden border-b border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-base font-semibold">Daily Logs</h2>
              <Button
                onClick={handleToday}
                variant="outline"
                size="sm"
                aria-label="Jump to today's log"
              >
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">Today</span>
              </Button>
            </div>
            <label htmlFor="log-select" className="sr-only">
              Select log date
            </label>
            <select
              id="log-select"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedLog.id}
              onChange={(e) => {
                const log = logs.find((l) => l.id === e.target.value);
                if (log) setSelectedLog(log);
              }}
            >
              {logs.map((log) => (
                <option key={log.id} value={log.id}>
                  {formatDateMobile(log.date)}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedLog ? (
          <>
            {/* OPTIMIZATION: Header with responsive layout */}
            <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
                <div
                  className="flex items-center gap-2 min-w-0 flex-1"
                  role="group"
                  aria-label="Date navigation"
                >
                  <Button
                    onClick={handlePreviousDay}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    aria-label="Go to previous day"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <h3
                    className="text-base sm:text-xl font-semibold truncate"
                    id="current-log-date"
                  >
                    <span className="hidden sm:inline">
                      {formatDate(selectedLog.date)}
                    </span>
                    <span className="sm:hidden">
                      {formatDateMobile(selectedLog.date)}
                    </span>
                  </h3>
                  <Button
                    onClick={handleNextDay}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    aria-label="Go to next day"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
                {isSaving && (
                  <div
                    className="text-xs sm:text-sm text-gray-500 shrink-0"
                    role="status"
                    aria-live="polite"
                  >
                    Saving...
                  </div>
                )}
              </div>
            </div>

            {/* OPTIMIZATION: Editor with responsive padding */}
            <div
              className="flex-1 overflow-y-auto p-4 sm:p-6"
              role="main"
              aria-labelledby="current-log-date"
            >
              <EditorWithPersistence
                key={selectedLog.id}
                entityType="dailyLog"
                entityId={selectedLog.id}
                initialContent={
                  selectedLog.content || { type: "doc", content: [] }
                }
                onContentChange={handleContentChange}
                placeholder="What happened today?"
              />
            </div>
          </>
        ) : (
          <div
            className="flex-1 flex items-center justify-center p-4"
            role="main"
          >
            <div className="text-center">
              <Calendar
                className="w-12 h-12 text-gray-400 mx-auto mb-4"
                aria-hidden="true"
              />
              <p className="text-gray-500 mb-4">
                Select a date to start writing
              </p>
              <Button onClick={handleToday} aria-label="Go to today's log">
                Go to Today
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
