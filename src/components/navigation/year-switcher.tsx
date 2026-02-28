"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createYear, getUserYears } from "@/lib/actions";
import { ChevronDown, Plus } from "lucide-react";
import { trapFocus, announceToScreenReader } from "@/lib/accessibility";
import type { Year } from "@prisma/client";

interface YearSwitcherProps {
  userId: string;
}

export function YearSwitcher({ userId }: YearSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [years, setYears] = useState<Year[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Handle keyboard navigation and focus trap
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const cleanup = trapFocus(dropdownRef.current);

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
          buttonRef.current?.focus();
        }
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        cleanup();
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

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

    // Announce year change to screen readers
    announceToScreenReader(`Switched to year ${year}`, "polite");
  };

  const handleCreateNewYear = async () => {
    const nextYear = new Date().getFullYear() + 1;

    // Check if year already exists
    if (years.some((y) => y.year === nextYear)) {
      handleYearChange(nextYear);
      return;
    }

    setIsCreating(true);
    announceToScreenReader("Creating new year...", "polite");

    try {
      const result = await createYear(userId, nextYear);
      if (result.success) {
        // Refresh years list
        const updatedResult = await getUserYears(userId);
        if (updatedResult.success && updatedResult.data) {
          setYears(updatedResult.data.sort((a, b) => b.year - a.year));
        }
        // Navigate to new year
        handleYearChange(nextYear);
        announceToScreenReader(
          `Created and switched to year ${nextYear}`,
          "polite"
        );
      }
    } catch (error) {
      console.error("Failed to create year:", error);
      announceToScreenReader("Failed to create new year", "assertive");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      announceToScreenReader("Year switcher opened", "polite");
    }
  };

  return (
    <div className="relative">
      {/* Modern Atelier pill-shaped year indicator */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface hover:bg-accent/20 rounded-full border border-border/60 shadow-sm transition-all duration-300 ease-out min-w-[100px] focus-ring"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Current year: ${currentYear}. Click to switch years.`}
        id="year-switcher-button"
      >
        <span className="font-mono font-semibold">{currentYear}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Modern Atelier dropdown with warm accents */}
          <div
            ref={dropdownRef}
            className="absolute top-full right-0 mt-2 bg-surface border border-border/60 rounded-lg shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] z-20 min-w-[160px] overflow-hidden"
            role="listbox"
            aria-labelledby="year-switcher-button"
          >
            <div className="py-2">
              {/* Create New Year option */}
              <button
                onClick={handleCreateNewYear}
                disabled={isCreating}
                className="w-full text-left px-4 py-2.5 text-sm transition-all duration-300 font-medium text-primary hover:bg-accent/30 hover:text-foreground flex items-center gap-2 border-b border-border/40 focus-ring-inset disabled:opacity-50 disabled:cursor-not-allowed"
                role="option"
                aria-selected="false"
                aria-label={
                  isCreating ? "Creating new year..." : "Create new year"
                }
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                {isCreating ? "Creating..." : "Create New Year"}
              </button>

              {/* Existing years */}
              {years.map((year) => (
                <button
                  key={year.id}
                  onClick={() => handleYearChange(year.year)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleYearChange(year.year);
                    }
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-300 font-mono focus-ring-inset ${
                    year.year === currentYear
                      ? "bg-accent text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-accent/20 hover:text-foreground"
                  }`}
                  role="option"
                  aria-selected={year.year === currentYear}
                  aria-label={`Switch to year ${year.year}${
                    year.year === currentYear ? " (current)" : ""
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
