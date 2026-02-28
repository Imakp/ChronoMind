"use client";

import { useState, useEffect, useRef } from "react";
import { Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InlineTagIndicatorProps {
  tags: string[];
  position: { x: number; y: number };
  visible: boolean;
  onTagClick?: (tagName: string) => void;
}

export function InlineTagIndicator({
  tags,
  position,
  visible,
  onTagClick,
}: InlineTagIndicatorProps) {
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!indicatorRef.current || !visible) return;

    const indicator = indicatorRef.current;
    const rect = indicator.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    let newLeft = position.x;
    let newTop = position.y - rect.height - 8; // 8px offset above the text

    // Adjust horizontal position if it goes off screen
    if (newLeft + rect.width > viewportWidth) {
      newLeft = viewportWidth - rect.width - 16;
    }
    if (newLeft < 16) newLeft = 16;

    // Adjust vertical position if it goes off screen
    if (newTop < 16) {
      newTop = position.y + 24; // Show below the text instead
    }

    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      setAdjustedPosition({ x: newLeft, y: newTop });
    });
  }, [position, visible, tags]);

  if (!visible || tags.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={indicatorRef}
        initial={{ opacity: 0, scale: 0.9, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 4 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed z-50 pointer-events-auto"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
        }}
      >
        <div className="flex items-center gap-1 bg-accent/95 backdrop-blur-sm border border-accent/20 rounded-full px-2 py-1 shadow-lg">
          <Hash className="w-3 h-3 text-accent-foreground/70" />
          <div className="flex items-center gap-1">
            {tags.slice(0, 3).map((tag, index) => (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className={cn(
                  "text-xs font-mono font-medium text-accent-foreground hover:text-accent-foreground/80 transition-colors",
                  onTagClick && "cursor-pointer hover:underline"
                )}
              >
                {tag}
                {index < Math.min(tags.length, 3) - 1 && (
                  <span className="ml-1 opacity-50">•</span>
                )}
              </button>
            ))}
            {tags.length > 3 && (
              <span className="text-xs font-mono text-accent-foreground/70">
                +{tags.length - 3}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
