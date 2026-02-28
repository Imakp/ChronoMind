"use client";

import React from "react";
import { Lightbulb, Brain, Zap } from "lucide-react";
import { EmptyState } from "./empty-state";

interface LessonsLearnedEmptyProps {
  onCreateLesson?: () => void;
  year: number;
}

export function LessonsLearnedEmpty({
  onCreateLesson,
  year,
}: LessonsLearnedEmptyProps) {
  const lessonPrompts = [
    "What did I learn from a recent challenge?",
    "What would I do differently next time?",
    "What insight changed my perspective?",
    "What skill did I develop this month?",
  ];

  return (
    <EmptyState
      icon={Lightbulb}
      title="Capture Your Growth"
      description={`Reflect on the insights and wisdom you gain throughout ${year}. Turn experiences into lasting knowledge.`}
      actionLabel="Record Your First Lesson"
      onAction={onCreateLesson}
    >
      <div className="space-y-4 text-left">
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Reflection Prompts
          </h4>
          <ul className="space-y-1">
            {lessonPrompts.map((prompt, index) => (
              <li
                key={index}
                className="text-xs text-muted-foreground flex items-start gap-2"
              >
                <Zap className="w-3 h-3 text-accent-foreground mt-0.5 flex-shrink-0" />
                {prompt}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Lessons can be tagged and connected to create a personal knowledge
          network.
        </div>
      </div>
    </EmptyState>
  );
}
