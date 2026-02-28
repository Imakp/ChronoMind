"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TagIndicatorState {
  visible: boolean;
  tags: string[];
  position: { x: number; y: number };
}

export function useInlineTagIndicators() {
  const [indicatorState, setIndicatorState] = useState<TagIndicatorState>({
    visible: false,
    tags: [],
    position: { x: 0, y: 0 },
  });

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showIndicator = useCallback((tags: string[], x: number, y: number) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    setIndicatorState({
      visible: true,
      tags,
      position: { x, y },
    });
  }, []);

  const hideIndicator = useCallback(() => {
    // Add a small delay to prevent flickering when moving between highlights
    hideTimeoutRef.current = setTimeout(() => {
      setIndicatorState((prev) => ({ ...prev, visible: false }));
    }, 100);
  }, []);

  const hideIndicatorImmediate = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIndicatorState((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if the target is a highlight element
      if (target.classList.contains("highlight-with-tags")) {
        const tagsAttr = target.getAttribute("data-tags");
        if (tagsAttr) {
          try {
            const tags = JSON.parse(tagsAttr);
            if (Array.isArray(tags) && tags.length > 0) {
              const rect = target.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top;
              showIndicator(tags, x, y);
            }
          } catch (error) {
            console.warn("Failed to parse tags from highlight:", error);
          }
        }
      }
    };

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const relatedTarget = event.relatedTarget as HTMLElement;

      // Only hide if we're not moving to another highlight or the indicator itself
      if (target.classList.contains("highlight-with-tags")) {
        if (
          !relatedTarget ||
          (!relatedTarget.classList.contains("highlight-with-tags") &&
            !relatedTarget.closest("[data-inline-tag-indicator]"))
        ) {
          hideIndicator();
        }
      }
    };

    // Add event listeners to the document
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [showIndicator, hideIndicator]);

  return {
    indicatorState,
    hideIndicatorImmediate,
  };
}
