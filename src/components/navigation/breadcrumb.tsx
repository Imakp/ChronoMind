"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  path: string;
  level: number;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        "flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto font-mono opacity-90",
        className
      )}
      aria-label="Breadcrumb navigation"
      role="navigation"
    >
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight
                className="w-3 h-3 text-muted-foreground/60 flex-shrink-0"
                aria-hidden="true"
              />
            )}
            {index === items.length - 1 ? (
              // Current page - not clickable
              <span
                className="text-foreground/80 font-medium whitespace-nowrap"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              // Clickable breadcrumb segment
              <Link
                href={item.path}
                className="hover:text-foreground transition-colors duration-300 whitespace-nowrap focus-ring rounded-sm px-1 py-0.5 -mx-1 -my-0.5"
                aria-label={`Navigate to ${item.label}`}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Utility function to generate breadcrumbs for hierarchical content
export function generateBreadcrumbs(
  year: number,
  section: string,
  hierarchy: Array<{ label: string; path?: string }>
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Add year context
  breadcrumbs.push({
    label: year.toString(),
    path: `/year/${year}`,
    level: 0,
  });

  // Add section
  const sectionLabels: Record<string, string> = {
    "daily-logs": "Daily Logs",
    "quarterly-reflections": "Quarterly Reflections",
    "yearly-goals": "Yearly Goals",
    "book-notes": "Book Notes",
    "lessons-learned": "Lessons Learned",
    "creative-dump": "Creative Dump",
    tags: "Tag Explorer",
  };

  breadcrumbs.push({
    label: sectionLabels[section] || section,
    path: `/year/${year}/${section}`,
    level: 1,
  });

  // Add hierarchical items
  hierarchy.forEach((item, index) => {
    breadcrumbs.push({
      label: item.label,
      path: item.path || "#",
      level: index + 2,
    });
  });

  return breadcrumbs;
}

// Hook for automatic breadcrumb generation based on pathname
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 2 || segments[0] !== "year") {
    return [];
  }

  const year = parseInt(segments[1]);
  if (isNaN(year)) {
    return [];
  }

  const breadcrumbs: BreadcrumbItem[] = [];

  // Add year
  breadcrumbs.push({
    label: year.toString(),
    path: `/year/${year}`,
    level: 0,
  });

  // Add section if present
  if (segments.length > 2) {
    const section = segments[2];
    const sectionLabels: Record<string, string> = {
      "daily-logs": "Daily Logs",
      "quarterly-reflections": "Quarterly Reflections",
      "yearly-goals": "Yearly Goals",
      "book-notes": "Book Notes",
      "lessons-learned": "Lessons Learned",
      "creative-dump": "Creative Dump",
      tags: "Tag Explorer",
    };

    breadcrumbs.push({
      label: sectionLabels[section] || section,
      path: `/year/${year}/${section}`,
      level: 1,
    });
  }

  return breadcrumbs;
}

// Component for automatic breadcrumb display
export function AutoBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumbs(pathname);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return <Breadcrumb items={breadcrumbs} className={className} />;
}
