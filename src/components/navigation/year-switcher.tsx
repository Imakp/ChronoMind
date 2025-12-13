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
  // Detect current year from pathname (derived state)
  const match = pathname.match(/\/year\/(\d{4})/);
  const currentYear = match ? parseInt(match[1]) : null;

  // Load user's years
  useEffect(() => {
    const loadYears = async () => {
      const result = await getUserYears(userId);
      if (result.success && result.data) {
        setYears(result.data.sort((a, b) => b.year - a.year));
      }
    };

    if (userId) {
      loadYears();
    }
  }, [userId]);

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
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
        aria-expanded={isOpen}
        aria-label="Switch year"
      >
        <span className="font-mono">{currentYear}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-20 min-w-[120px]">
            <div className="py-1">
              {years.map((year) => (
                <button
                  key={year.id}
                  onClick={() => handleYearChange(year.year)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors font-mono ${
                    year.year === currentYear
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
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
