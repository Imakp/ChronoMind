"use client";

import React from "react";
import { Tag, Search, Network } from "lucide-react";
import { EmptyState } from "./empty-state";

interface TagExplorerEmptyProps {
  onExploreContent?: () => void;
  year: number;
}

export function TagExplorerEmpty({
  onExploreContent,
  year,
}: TagExplorerEmptyProps) {
  const tagExamples = [
    "#productivity",
    "#learning",
    "#relationships",
    "#health",
    "#creativity",
  ];

  return (
    <EmptyState
      icon={Tag}
      title="Your Knowledge Network Awaits"
      description={`Start highlighting text in your daily logs, goals, and notes. Tags will appear here, creating connections across your entire ${year} knowledge base.`}
      actionLabel="Explore Other Sections"
      onAction={onExploreContent}
    >
      <div className="space-y-4 text-left">
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
            <Search className="w-4 h-4" />
            How Tagging Works
          </h4>
          <ol className="space-y-1 text-xs text-muted-foreground">
            <li>1. Select any text in your content</li>
            <li>2. Click "Highlight" and add tags</li>
            <li>3. Find connections here in Tag Explorer</li>
          </ol>
        </div>

        <div className="p-3 bg-accent/10 rounded-lg">
          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
            <Network className="w-4 h-4" />
            Popular Tag Ideas
          </h4>
          <div className="flex flex-wrap gap-1">
            {tagExamples.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-accent/30 text-accent-foreground px-2 py-1 rounded-full font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Tags create a powerful knowledge network across all your content.
        </div>
      </div>
    </EmptyState>
  );
}
