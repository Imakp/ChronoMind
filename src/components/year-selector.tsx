"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createYear } from "@/lib/actions";
import type { Year } from "@prisma/client";

interface YearSelectorProps {
  currentYear?: number;
  availableYears: Year[];
  userId: string;
}

export default function YearSelector({
  currentYear,
  availableYears,
  userId,
}: YearSelectorProps) {
  const [selectedYear, setSelectedYear] = useState<number>(
    currentYear || new Date().getFullYear()
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    // Navigate to the year-specific dashboard
    router.push(`/year/${year}`);
  };

  const handleCreateYear = async () => {
    if (availableYears.some((y) => y.year === selectedYear)) {
      // Year already exists, just navigate to it
      handleYearSelect(selectedYear);
      return;
    }

    startTransition(async () => {
      const result = await createYear(userId, selectedYear);
      if (result.success) {
        handleYearSelect(selectedYear);
      } else {
        console.error("Failed to create year:", result.error);
        // TODO: Add toast notification for error
      }
    });
  };

  const currentYearValue = new Date().getFullYear();
  const yearOptions = [];

  // Generate year options (current year ± 5 years)
  for (let i = currentYearValue - 5; i <= currentYearValue + 5; i++) {
    yearOptions.push(i);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ChronoMind</h1>
        <p className="text-gray-600">
          Select a year to access your journal or create a new one
        </p>
      </div>

      {/* Existing Years */}
      {availableYears.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Your Existing Years
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {availableYears
              .sort((a, b) => b.year - a.year)
              .map((year) => (
                <Button
                  key={year.id}
                  variant={currentYear === year.year ? "default" : "outline"}
                  onClick={() => handleYearSelect(year.year)}
                  className="h-12 text-lg font-medium"
                >
                  {year.year}
                </Button>
              ))}
          </div>
        </div>
      )}

      {/* Year Creation */}
      <div className="border-t pt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Create or Access Year
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1">
            <label htmlFor="year-select" className="sr-only">
              Select Year
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isPending}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleCreateYear}
            disabled={isPending}
            className="w-full sm:w-auto px-6 py-2"
          >
            {isPending
              ? "Loading..."
              : availableYears.some((y) => y.year === selectedYear)
              ? "Open Year"
              : "Create Year"}
          </Button>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {availableYears.some((y) => y.year === selectedYear) ? (
            <p>This year already exists. Click "Open Year" to access it.</p>
          ) : (
            <p>
              This will create a new year with empty sections for Daily Logs,
              Quarterly Reflections, Goals, Book Notes, Lessons Learned, and
              Creative Dump.
            </p>
          )}
        </div>
      </div>

      {/* Quick Access to Current Year */}
      {!availableYears.some((y) => y.year === currentYearValue) && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            Quick start: Create your {currentYearValue} journal
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedYear(currentYearValue);
              startTransition(async () => {
                const result = await createYear(userId, currentYearValue);
                if (result.success) {
                  handleYearSelect(currentYearValue);
                }
              });
            }}
            disabled={isPending}
          >
            Create {currentYearValue} Journal
          </Button>
        </div>
      )}
    </div>
  );
}
