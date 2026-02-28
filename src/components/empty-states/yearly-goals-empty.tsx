"use client";

import React from "react";
import { Target, TrendingUp, CheckCircle } from "lucide-react";
import { EmptyState } from "./empty-state";

interface YearlyGoalsEmptyProps {
  onCreateGoal?: () => void;
  year: number;
}

export function YearlyGoalsEmpty({
  onCreateGoal,
  year,
}: YearlyGoalsEmptyProps) {
  const goalExamples = [
    "Learn a new programming language",
    "Read 24 books this year",
    "Build a side project",
    "Improve work-life balance",
  ];

  return (
    <EmptyState
      icon={Target}
      title="Set Your Direction"
      description={`Define what you want to achieve in ${year}. Break down big aspirations into trackable goals with tasks and milestones.`}
      actionLabel="Create Your First Goal"
      onAction={onCreateGoal}
    >
      <div className="space-y-4 text-left">
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Goal Ideas for {year}
          </h4>
          <ul className="space-y-1">
            {goalExamples.map((example, index) => (
              <li
                key={index}
                className="text-xs text-muted-foreground flex items-center gap-2"
              >
                <CheckCircle className="w-3 h-3 text-accent-foreground" />
                {example}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Goals can have tasks, and tasks can have subtasks. Track progress with
          visual indicators.
        </div>
      </div>
    </EmptyState>
  );
}
