"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DailyLogs } from "@/components/daily-logs";
import { QuarterlyReflections } from "@/components/quarterly-reflections";
import { YearlyGoals } from "@/components/yearly-goals";
import { BookNotes } from "@/components/book-notes";
import { LessonsLearned } from "@/components/lessons-learned";
import { CreativeDump } from "@/components/creative-dump";
import type { Year } from "@prisma/client";

interface YearDashboardProps {
  year: Year;
  userId: string;
}

export type SectionType =
  | "daily-logs"
  | "quarterly-reflections"
  | "yearly-goals"
  | "book-notes"
  | "lessons-learned"
  | "creative-dump";

export interface Section {
  id: SectionType;
  title: string;
  description: string;
  icon: string;
}

export const sections: Section[] = [
  {
    id: "daily-logs" as SectionType,
    title: "Daily Logs",
    description: "Track your daily thoughts and activities",
    icon: "📝",
  },
  {
    id: "quarterly-reflections" as SectionType,
    title: "Quarterly Reflections",
    description: "Deep insights for each quarter",
    icon: "🔍",
  },
  {
    id: "yearly-goals" as SectionType,
    title: "Yearly Goals",
    description: "Track your goals with hierarchical progress",
    icon: "🎯",
  },
  {
    id: "book-notes" as SectionType,
    title: "Book Notes",
    description: "Organize notes by Genre > Book > Chapter",
    icon: "📚",
  },
  {
    id: "lessons-learned" as SectionType,
    title: "Lessons Learned",
    description: "Capture insights in card format",
    icon: "💡",
  },
  {
    id: "creative-dump" as SectionType,
    title: "Creative Dump",
    description: "Unstructured space for creative ideas",
    icon: "🎨",
  },
];

export default function YearDashboard({ year, userId }: YearDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionType | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle URL hash for deep linking to sections
  useEffect(() => {
    const hash = window.location.hash.slice(1) as SectionType;
    if (hash && sections.some((s) => s.id === hash)) {
      setActiveSection(hash);
    }
  }, []);

  // Update URL hash when section changes
  useEffect(() => {
    if (activeSection) {
      window.history.replaceState(null, "", `#${activeSection}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [activeSection]);

  const handleSectionChange = (sectionId: SectionType) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  const handleBackToSections = () => {
    setActiveSection(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {year.year} Journal
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Your personal knowledge management space for {year.year}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            ← Back to Years
          </Button>
        </div>
      </div>

      {!activeSection ? (
        // Section Selection View
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          data-testid="section-grid"
        >
          {sections.map((section) => (
            <button
              key={section.id}
              data-testid={`section-card-${section.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => handleSectionChange(section.id)}
              aria-label={`Open ${section.title}`}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-3 sm:mb-4">
                  <span
                    className="text-2xl sm:text-3xl mr-2 sm:mr-3"
                    aria-hidden="true"
                  >
                    {section.icon}
                  </span>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {section.title}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  {section.description}
                </p>
                <div className="text-sm text-blue-600 font-medium">
                  Open Section →
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        // Active Section View
        <div
          className="bg-white rounded-lg shadow-md"
          data-testid="active-section-container"
        >
          <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center">
                <span
                  className="text-xl sm:text-2xl mr-2 sm:mr-3"
                  aria-hidden="true"
                >
                  {sections.find((s) => s.id === activeSection)?.icon}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {sections.find((s) => s.id === activeSection)?.title}
                </h2>
              </div>
              <Button
                variant="outline"
                onClick={handleBackToSections}
                className="w-full sm:w-auto"
                data-testid="back-to-sections-button"
              >
                ← Back to Sections
              </Button>
            </div>
          </div>

          <div
            className="min-h-[60vh] sm:h-[calc(100vh-250px)]"
            data-testid={`section-content-${activeSection}`}
          >
            {activeSection === "daily-logs" ? (
              <DailyLogs yearId={year.id} year={year.year} />
            ) : activeSection === "quarterly-reflections" ? (
              <QuarterlyReflections yearId={year.id} year={year.year} />
            ) : activeSection === "yearly-goals" ? (
              <YearlyGoals yearId={year.id} year={year.year} />
            ) : activeSection === "book-notes" ? (
              <BookNotes yearId={year.id} year={year.year} />
            ) : activeSection === "lessons-learned" ? (
              <LessonsLearned yearId={year.id} year={year.year} />
            ) : activeSection === "creative-dump" ? (
              <CreativeDump yearId={year.id} year={year.year} />
            ) : null}
          </div>
        </div>
      )}

      {/* Section Navigation - Mobile Optimized */}
      {activeSection && (
        <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          {/* Mobile: Dropdown Menu */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg"
              data-testid="mobile-section-menu-toggle"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle section menu"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true">
                  {sections.find((s) => s.id === activeSection)?.icon}
                </span>
                <span className="font-medium">
                  {sections.find((s) => s.id === activeSection)?.title}
                </span>
              </span>
              <span className="text-gray-500" aria-hidden="true">
                {isMobileMenuOpen ? "▲" : "▼"}
              </span>
            </button>
            {isMobileMenuOpen && (
              <div className="mt-2 space-y-1" data-testid="mobile-section-menu">
                {sections
                  .filter((s) => s.id !== activeSection)
                  .map((section) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      data-testid={`mobile-section-${section.id}`}
                    >
                      <span aria-hidden="true">{section.icon}</span>
                      <span>{section.title}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Desktop: Horizontal Buttons */}
          <div
            className="hidden sm:flex flex-wrap gap-2"
            data-testid="desktop-section-nav"
          >
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "ghost"}
                size="sm"
                onClick={() => handleSectionChange(section.id)}
                className="flex items-center gap-2"
                data-testid={`nav-button-${section.id}`}
                aria-current={activeSection === section.id ? "page" : undefined}
              >
                <span aria-hidden="true">{section.icon}</span>
                <span className="hidden md:inline">{section.title}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
