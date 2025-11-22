"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Year } from "@prisma/client";
import { sections, type SectionType } from "@/components/year-dashboard";

interface YearShellProps {
  year: Year;
  userId: string;
  children: React.ReactNode;
}

export function YearShell({ year, userId, children }: YearShellProps) {
  const pathname = usePathname();

  // Detect active section from pathname
  const activeSection = sections.find((s) =>
    pathname.includes(`/year/${year.year}/${s.id}`)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 sm:py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <Link
                href={`/year/${year.year}`}
                className="hover:text-gray-900 font-medium"
              >
                Dashboard
              </Link>
              {activeSection && (
                <>
                  <span>/</span>
                  <span className="text-gray-900 font-medium flex items-center gap-1.5">
                    <span aria-hidden="true">{activeSection.icon}</span>
                    {activeSection.title}
                  </span>
                </>
              )}
            </div>

            {/* Quick Section Switcher */}
            {activeSection && (
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                  <Link
                    key={section.id}
                    href={`/year/${year.year}/${section.id}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      activeSection.id === section.id
                        ? "bg-blue-100 text-blue-900 font-medium"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    aria-current={
                      activeSection.id === section.id ? "page" : undefined
                    }
                  >
                    <span aria-hidden="true">{section.icon}</span>
                    <span className="hidden sm:inline">{section.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area - UPDATED for Alignment */}
      {/* Added: max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 to match Navbar */}
      <main className="flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeSection ? (
          // "App Mode": Wrap active sections in a defined card to float on the gray background
          <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {children}
          </div>
        ) : (
          // "Dashboard Mode": Allow scrolling for the dashboard grid
          <div className="h-full overflow-y-auto">{children}</div>
        )}
      </main>
    </div>
  );
}
