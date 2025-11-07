"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Year } from "@prisma/client";

interface YearDashboardProps {
  year: Year;
  userId: string;
}

type SectionType =
  | "daily-logs"
  | "quarterly-reflections"
  | "yearly-goals"
  | "book-notes"
  | "lessons-learned"
  | "creative-dump";

const sections = [
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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {year.year} Journal
            </h1>
            <p className="text-gray-600 mt-1">
              Your personal knowledge management space for {year.year}
            </p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            ← Back to Years
          </Button>
        </div>
      </div>

      {!activeSection ? (
        // Section Selection View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
              onClick={() => setActiveSection(section.id)}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{section.icon}</span>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {section.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <Button variant="outline" className="w-full">
                  Open Section
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Active Section View
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {sections.find((s) => s.id === activeSection)?.icon}
                </span>
                <h2 className="text-2xl font-bold text-gray-900">
                  {sections.find((s) => s.id === activeSection)?.title}
                </h2>
              </div>
              <Button variant="outline" onClick={() => setActiveSection(null)}>
                ← Back to Sections
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Section Coming Soon
              </h3>
              <p className="text-gray-600 mb-6">
                This section will be implemented in upcoming tasks. For now, you
                can navigate between sections to see the structure.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveSection(null)}
                >
                  Back to All Sections
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Navigation */}
      {activeSection && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveSection(section.id)}
                className="flex items-center gap-2"
              >
                <span>{section.icon}</span>
                {section.title}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
