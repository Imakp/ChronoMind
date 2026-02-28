"use client";

import React from "react";
import { BookOpen, Library, Quote } from "lucide-react";
import { EmptyState } from "./empty-state";

interface BookNotesEmptyProps {
  onCreateGenre?: () => void;
  year: number;
}

export function BookNotesEmpty({ onCreateGenre, year }: BookNotesEmptyProps) {
  const genreExamples = [
    "Fiction",
    "Non-Fiction",
    "Biography",
    "Technical",
    "Philosophy",
  ];

  return (
    <EmptyState
      icon={BookOpen}
      title="Build Your Reading Journey"
      description={`Document the books that shape your ${year}. Organize by genre, capture insights, and track your literary exploration.`}
      actionLabel="Add Your First Genre"
      onAction={onCreateGenre}
    >
      <div className="space-y-4 text-left">
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
            <Library className="w-4 h-4" />
            Popular Genres
          </h4>
          <div className="flex flex-wrap gap-1">
            {genreExamples.map((genre, index) => (
              <span
                key={index}
                className="text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
          <Quote className="w-5 h-5 text-accent-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-sm text-foreground">
              Reading Notes
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Each book can have chapters with detailed notes. Highlight key
              passages and tag insights.
            </p>
          </div>
        </div>
      </div>
    </EmptyState>
  );
}
