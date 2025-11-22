"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUserYears } from "@/lib/actions";
import { ChevronDown } from "lucide-react";
import type { Year } from "@prisma/client";

interface YearSwitcherProps {
  userId: string;
}

export function YearSwitcher({ userId }: YearSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [years, setYears] = useState<Year[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  // Detect current year from pathname
  useEffect(() => {
    const match = pathname.match(/\/year\/(\d{4})/);
    if (match) {
      setCurrentYear(parseInt(match[1]));
    } else {
      setCurrentYear(null);
    }
  }, [pathname]);

  // Load user's years
  useEffect(() => {
    if (userId) {
      loadYears();
    }
  }, [userId]);

  const loadYears = async () => {
    const result = await getUserYears(userId);
    if (result.success && result.data) {
      setYears(result.data.sort((a, b) => b.year - a.year));
    }
  };

  // Don't show if not on a year page
  if (!currentYear) {
    return null;
  }

  const handleYearChange = (year: number) => {
    // Extract the section from current path if any
    const sectionMatch = pathname.match(/\/year\/\d{4}\/(.+)/);
    const section = sectionMatch ? sectionMatch[1] : "";

    // Navigate to the same section in the new year
    if (section) {
      router.push(`/year/${year}/${section}`);
    } else {
      router.push(`/year/${year}`);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        aria-expanded={isOpen}
        aria-label="Switch year"
      >
        <span>{currentYear}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[120px]">
            <div className="py-1">
              {years.map((year) => (
                <button
                  key={year.id}
                  onClick={() => handleYearChange(year.year)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    year.year === currentYear
                      ? "bg-blue-50 text-blue-900 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {year.year}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
