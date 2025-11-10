"use client";

import { useState, useEffect, useCallback } from "react";
import { QuarterlyReflection } from "@prisma/client";
import { EditorWithPersistence } from "./editor";
import {
  getQuarterlyReflections,
  updateQuarterlyReflection,
} from "@/lib/actions";
import { Button } from "./ui/button";

interface QuarterlyReflectionsProps {
  yearId: string;
  year: number;
}

const QUARTERS = [
  { number: 1, label: "Q1", name: "First Quarter", months: "Jan - Mar" },
  { number: 2, label: "Q2", name: "Second Quarter", months: "Apr - Jun" },
  { number: 3, label: "Q3", name: "Third Quarter", months: "Jul - Sep" },
  { number: 4, label: "Q4", name: "Fourth Quarter", months: "Oct - Dec" },
] as const;

export function QuarterlyReflections({
  yearId,
  year,
}: QuarterlyReflectionsProps) {
  const [reflections, setReflections] = useState<QuarterlyReflection[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load all reflections for the year
  useEffect(() => {
    loadReflections();
  }, [yearId]);

  const loadReflections = async () => {
    setIsLoading(true);
    const result = await getQuarterlyReflections(yearId);
    if (result.success && result.data) {
      setReflections(result.data);
    }
    setIsLoading(false);
  };

  // Get the current reflection for the selected quarter
  const currentReflection = reflections.find(
    (r) => r.quarter === selectedQuarter
  );

  // Auto-save functionality
  const handleContentChange = useCallback(
    (content: any) => {
      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set new timeout for auto-save
      const timeout = setTimeout(async () => {
        setIsSaving(true);
        await updateQuarterlyReflection(yearId, selectedQuarter, content);
        // Reload reflections to get the updated data
        await loadReflections();
        setIsSaving(false);
      }, 1000); // Save after 1 second of inactivity

      setSaveTimeout(timeout);
    },
    [yearId, selectedQuarter, saveTimeout]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-gray-500">Loading quarterly reflections...</div>
        </div>
      </div>
    );
  }

  return (
    /* OPTIMIZATION: Stack vertically on mobile, horizontal on desktop */
    <div className="flex h-full flex-col md:flex-row">
      {/* OPTIMIZATION: Desktop sidebar - hidden on mobile, visible at md+ */}
      <div className="hidden md:block w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Quarterly Reflections</h2>
          <p className="text-sm text-gray-600 mb-4">
            Reflect on each quarter of {year}
          </p>
          <div className="space-y-2">
            {QUARTERS.map((quarter) => (
              <button
                key={quarter.number}
                onClick={() => setSelectedQuarter(quarter.number)}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                  selectedQuarter === quarter.number
                    ? "bg-blue-100 text-blue-900 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <div className="font-semibold">{quarter.label}</div>
                <div className="text-xs text-gray-600">{quarter.months}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OPTIMIZATION: Mobile quarter selector - only visible below md */}
      <div className="md:hidden border-b border-gray-200 bg-white p-4">
        <h2 className="text-base font-semibold mb-3">Quarterly Reflections</h2>
        <div className="flex gap-2 justify-stretch">
          {QUARTERS.map((quarter) => (
            <button
              key={quarter.number}
              onClick={() => setSelectedQuarter(quarter.number)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedQuarter === quarter.number
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {quarter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* OPTIMIZATION: Header with responsive layout */}
        <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-semibold truncate">
                {QUARTERS[selectedQuarter - 1].name}
              </h3>
              <p className="text-sm text-gray-600">
                {QUARTERS[selectedQuarter - 1].months} {year}
              </p>
            </div>
            {isSaving && (
              <div className="text-xs sm:text-sm text-gray-500 shrink-0">
                Saving...
              </div>
            )}
          </div>
        </div>

        {/* OPTIMIZATION: Editor with responsive padding */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <EditorWithPersistence
            key={`${yearId}-q${selectedQuarter}`}
            entityType="quarterlyReflection"
            entityId={currentReflection?.id || `${yearId}-q${selectedQuarter}`}
            initialContent={
              currentReflection?.content || { type: "doc", content: [] }
            }
            onContentChange={handleContentChange}
            placeholder={`Reflect on your ${QUARTERS[
              selectedQuarter - 1
            ].name.toLowerCase()}...`}
          />
        </div>
      </div>
    </div>
  );
}
