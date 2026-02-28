"use client";

import React from "react";
import { PenTool, Calendar, TrendingUp } from "lucide-react";
import { EmptyState } from "./empty-state";

interface QuarterlyReflectionsEmptyProps {
  onCreateReflection?: () => void;
  year: number;
}

export function QuarterlyReflectionsEmpty({
  onCreateReflection,
  year,
}: QuarterlyReflectionsEmptyProps) {
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const quarters = [
    { q: 1, name: "Q1", months: "Jan - Mar", theme: "New Beginnings" },
    { q: 2, name: "Q2", months: "Apr - Jun", theme: "Growth & Progress" },
    { q: 3, name: "Q3", months: "Jul - Sep", theme: "Summer Momentum" },
    { q: 4, name: "Q4", months: "Oct - Dec", theme: "Reflection & Planning" },
  ];

  const reflectionPrompts = [
    "What were my biggest wins this quarter?",
    "What challenges did I overcome?",
    "What would I do differently?",
    "How did I grow as a person?",
  ];

  return (
    <EmptyState
      icon={PenTool}
      title="Reflect on Your Journey"
      description={`Take time to reflect on your progress every quarter in ${year}. Deep reflection helps you learn and adjust course.`}
      actionLabel={`Start Q${currentQuarter} Reflection`}
      onAction={onCreateReflection}
    >
      <div className="space-y-4 text-left">
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {year} Quarters
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {quarters.map((quarter) => (
              <div
                key={quarter.q}
                className={`text-xs p-2 rounded border ${
                  quarter.q === currentQuarter
                    ? "bg-accent/20 border-accent/30 text-accent-foreground"
                    : "bg-background border-border/30 text-muted-foreground"
                }`}
              >
                <div className="font-medium">{quarter.name}</div>
                <div className="text-[10px] opacity-75">{quarter.months}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-accent/10 rounded-lg">
          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Reflection Questions
          </h4>
          <ul className="space-y-1">
            {reflectionPrompts.slice(0, 2).map((prompt, index) => (
              <li key={index} className="text-xs text-muted-foreground">
                • {prompt}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </EmptyState>
  );
}
