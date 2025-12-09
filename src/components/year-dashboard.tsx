"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Calendar,
  Hash,
  Target,
  Lightbulb,
  PenTool,
  ArrowRight,
} from "lucide-react";

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

const iconMap = {
  "daily-logs": Calendar,
  "quarterly-reflections": PenTool,
  "yearly-goals": Target,
  "book-notes": BookOpen,
  "lessons-learned": Lightbulb,
  "creative-dump": Hash,
};

const colorMap = {
  "daily-logs": "from-blue-50 to-blue-100/50",
  "quarterly-reflections": "from-purple-50 to-purple-100/50",
  "yearly-goals": "from-emerald-50 to-emerald-100/50",
  "book-notes": "from-amber-50 to-amber-100/50",
  "lessons-learned": "from-rose-50 to-rose-100/50",
  "creative-dump": "from-cyan-50 to-cyan-100/50",
};

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
  return (
    <div className="pb-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground tracking-tight">
          {year} Journal
        </h1>
        <p className="text-base text-muted-foreground mt-2">
          Your personal knowledge management space for {year}
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        data-testid="section-grid"
      >
        {sections.map((section) => {
          const Icon = iconMap[section.id];
          const gradient = colorMap[section.id];

          return (
            <Link
              key={section.id}
              href={`/year/${year}/${section.id}`}
              data-testid={`section-card-${section.id}`}
              className="block group"
            >
              <Card className="h-full hover-elevate border-border/60 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/50">
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <CardTitle className="text-lg font-serif">
                        {section.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-5">
                  <CardDescription className="text-sm leading-relaxed mb-3">
                    {section.description}
                  </CardDescription>
                  <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    <span>Open</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
