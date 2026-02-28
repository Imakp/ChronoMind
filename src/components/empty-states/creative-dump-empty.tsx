"use client";

import React from "react";
import { Hash, Palette, Sparkles } from "lucide-react";
import { EmptyState } from "./empty-state";

interface CreativeDumpEmptyProps {
  onCreateNote?: () => void;
  year: number;
}

export function CreativeDumpEmpty({
  onCreateNote,
  year,
}: CreativeDumpEmptyProps) {
  const creativeIdeas = [
    "Random thoughts and observations",
    "Creative project ideas",
    "Interesting quotes or phrases",
    "Sketches and visual concepts",
    "Music or art inspirations",
  ];

  return (
    <EmptyState
      icon={Hash}
      title="Unleash Your Creativity"
      description={`A free-form space for all your creative thoughts, ideas, and inspirations throughout ${year}. No structure required.`}
      actionLabel="Add Your First Creative Note"
      onAction={onCreateNote}
    >
      <div className="space-y-4 text-left">
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            What Goes Here?
          </h4>
          <ul className="space-y-1">
            {creativeIdeas.map((idea, index) => (
              <li
                key={index}
                className="text-xs text-muted-foreground flex items-start gap-2"
              >
                <Sparkles className="w-3 h-3 text-accent-foreground mt-0.5 flex-shrink-0" />
                {idea}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          This is your creative playground. Capture anything that sparks your
          imagination.
        </div>
      </div>
    </EmptyState>
  );
}
