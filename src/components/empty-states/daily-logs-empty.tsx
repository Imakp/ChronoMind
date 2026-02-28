"use client";

import React from "react";
import { Calendar, PenTool, Sparkles } from "lucide-react";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";

interface DailyLogsEmptyProps {
  onCreateEntry?: () => void;
  year: number;
}

export function DailyLogsEmpty({ onCreateEntry, year }: DailyLogsEmptyProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <EmptyState
      icon={Calendar}
      title="Start Your Daily Practice"
      description={`Begin documenting your ${year} journey. Daily logs help you capture thoughts, experiences, and reflections as they happen.`}
      actionLabel="Create Today's Entry"
      onAction={onCreateEntry}
    >
      <div className="space-y-4 text-left">
        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
          <PenTool className="w-5 h-5 text-accent-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-sm text-foreground">
              Today's Prompt
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {currentDate} - What's on your mind today?
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
          <Sparkles className="w-5 h-5 text-accent-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-sm text-foreground">Pro Tip</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Highlight any text and add tags to create connections across your
              entire knowledge base.
            </p>
          </div>
        </div>
      </div>
    </EmptyState>
  );
}
