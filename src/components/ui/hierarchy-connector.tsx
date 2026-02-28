import React from "react";
import { cn } from "@/lib/utils";

interface HierarchyConnectorProps {
  children: React.ReactNode;
  level?: number;
  isLast?: boolean;
  hasChildren?: boolean;
  className?: string;
}

/**
 * Hierarchical connector component that adds subtle vertical connecting lines
 * between parent and child items according to Modern Atelier design
 *
 * Features:
 * - Subtle vertical lines (1px, hsl(40 10% 88%))
 * - 24px indentation per level
 * - Proper connection between parent and child items
 */
export function HierarchyConnector({
  children,
  level = 0,
  isLast = false,
  hasChildren = false,
  className,
}: HierarchyConnectorProps) {
  const indentWidth = level * 24; // 24px per level

  return (
    <div className={cn("relative", className)}>
      {/* Vertical connector line */}
      {level > 0 && (
        <div
          className="absolute top-0 bottom-0 border-l border-border/60"
          style={{
            left: `${indentWidth - 12}px`, // Position line 12px from the left edge of content
            height: isLast ? "50%" : "100%",
          }}
        />
      )}

      {/* Horizontal connector line */}
      {level > 0 && (
        <div
          className="absolute top-1/2 border-t border-border/60"
          style={{
            left: `${indentWidth - 12}px`,
            width: "12px",
            transform: "translateY(-50%)",
          }}
        />
      )}

      {/* Content with proper indentation */}
      <div style={{ paddingLeft: `${indentWidth}px` }}>{children}</div>

      {/* Child connector continuation */}
      {hasChildren && !isLast && level > 0 && (
        <div
          className="absolute border-l border-border/60"
          style={{
            left: `${indentWidth - 12}px`,
            top: "50%",
            bottom: 0,
          }}
        />
      )}
    </div>
  );
}

interface HierarchyTreeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Container for hierarchical tree structure with connectors
 */
export function HierarchyTree({ children, className }: HierarchyTreeProps) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}

interface ExpandableHierarchyItemProps {
  title: React.ReactNode;
  children?: React.ReactNode;
  level?: number;
  isLast?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  onToggle?: (expanded: boolean) => void;
}

/**
 * Expandable hierarchy item with connector lines and expand/collapse functionality
 */
export function ExpandableHierarchyItem({
  title,
  children,
  level = 0,
  isLast = false,
  defaultExpanded = true,
  className,
  onToggle,
}: ExpandableHierarchyItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const hasChildren = React.Children.count(children) > 0;

  const handleToggle = React.useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  }, [isExpanded, onToggle]);

  return (
    <div className={className}>
      <HierarchyConnector
        level={level}
        isLast={isLast && !isExpanded}
        hasChildren={hasChildren && isExpanded}
      >
        <div
          className={cn(
            "flex items-center gap-2 py-1",
            hasChildren &&
              "cursor-pointer hover:bg-secondary/20 rounded px-2 -mx-2 transition-colors"
          )}
          onClick={hasChildren ? handleToggle : undefined}
        >
          {hasChildren && (
            <span
              className={cn(
                "text-muted-foreground transition-transform duration-200 text-sm",
                isExpanded ? "rotate-90" : "rotate-0"
              )}
            >
              ▶
            </span>
          )}
          <div className="flex-1">{title}</div>
        </div>
      </HierarchyConnector>

      {/* Children with animation */}
      {hasChildren && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            isExpanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="pt-1">
            {React.Children.map(children, (child, index) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  level: level + 1,
                  isLast: index === React.Children.count(children) - 1,
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple hierarchy item without expand/collapse functionality
 */
export function SimpleHierarchyItem({
  children,
  level = 0,
  isLast = false,
  className,
}: {
  children: React.ReactNode;
  level?: number;
  isLast?: boolean;
  className?: string;
}) {
  return (
    <HierarchyConnector level={level} isLast={isLast} className={className}>
      <div className="py-1">{children}</div>
    </HierarchyConnector>
  );
}
