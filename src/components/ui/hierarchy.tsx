import React from "react";
import { cn } from "@/lib/utils";

interface HierarchyItemProps {
  level: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
  indentLevel?: number;
  onClick?: () => void;
}

/**
 * HierarchyItem component implementing the Modern Atelier 3-level visual hierarchy
 *
 * Level 1: Lora Semibold 600, 20px, primary ink color (Goals/Genres)
 * Level 2: Inter Medium 500, 16px, 30% lighter ink (Tasks/Books)
 * Level 3: Inter Regular 400, 14px, 45% lighter ink (Sub-tasks/Chapters)
 *
 * Each level gets 24px indentation when nested
 */
export function HierarchyItem({
  level,
  children,
  className,
  indentLevel = 0,
  onClick,
}: HierarchyItemProps) {
  const baseStyles = "transition-colors duration-300";

  const levelStyles = {
    1: "font-serif font-semibold text-xl text-foreground", // Lora Semibold 600, 20px
    2: "font-sans font-medium text-base text-foreground/70", // Inter Medium 500, 16px, 30% lighter
    3: "font-sans font-normal text-sm text-foreground/55", // Inter Regular 400, 14px, 45% lighter
  };

  const indentStyle =
    indentLevel > 0 ? { paddingLeft: `${indentLevel * 24}px` } : {};

  return (
    <div
      className={cn(baseStyles, levelStyles[level], className)}
      style={indentStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface HierarchyContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Container for hierarchical content with proper spacing and structure
 */
export function HierarchyContainer({
  children,
  className,
}: HierarchyContainerProps) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}

interface HierarchyGroupProps {
  title: string;
  level: 1 | 2 | 3;
  children?: React.ReactNode;
  className?: string;
  indentLevel?: number;
  isCollapsible?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

/**
 * A hierarchical group with title and optional children
 * Supports expand/collapse functionality
 */
export function HierarchyGroup({
  title,
  level,
  children,
  className,
  indentLevel = 0,
  isCollapsible = false,
  isExpanded = true,
  onToggle,
}: HierarchyGroupProps) {
  return (
    <div className={className}>
      <HierarchyItem
        level={level}
        indentLevel={indentLevel}
        className={cn(
          "flex items-center gap-2",
          isCollapsible && "cursor-pointer hover:text-foreground/80"
        )}
        onClick={isCollapsible ? onToggle : undefined}
      >
        {isCollapsible && (
          <span className="text-muted-foreground transition-transform duration-200">
            {isExpanded ? "▼" : "▶"}
          </span>
        )}
        {title}
      </HierarchyItem>

      {children && isExpanded && <div className="mt-3">{children}</div>}
    </div>
  );
}

/**
 * Utility function to get hierarchy level styling classes
 */
export function getHierarchyLevelClass(level: 1 | 2 | 3): string {
  const levelClasses = {
    1: "hierarchy-level-1",
    2: "hierarchy-level-2",
    3: "hierarchy-level-3",
  };

  return levelClasses[level];
}

/**
 * Hook to manage hierarchical state (expand/collapse)
 */
export function useHierarchyState(initialExpanded: boolean = true) {
  const [isExpanded, setIsExpanded] = React.useState(initialExpanded);

  const toggle = React.useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return { isExpanded, toggle };
}
