"use client";

import Link from "next/link";

interface YearDashboardProps {
  year: number;
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
    icon: "🤔",
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
    icon: "🧠",
  },
];

export default function YearDashboard({ year }: YearDashboardProps) {
  // UPDATED: Removed "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" as YearShell handles it now
  return (
    <div className="pb-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {year} Journal
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Your personal knowledge management space for {year}
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        data-testid="section-grid"
      >
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`/year/${year}/${section.id}`}
            data-testid={`section-card-${section.id}`}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 block"
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
          </Link>
        ))}
      </div>
    </div>
  );
}
