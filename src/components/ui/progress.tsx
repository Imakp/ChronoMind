import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  variant?: "default" | "warm";
  showText?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    { className, value = 0, variant = "warm", showText = false, ...props },
    ref
  ) => {
    const clampedValue = Math.max(0, Math.min(100, value || 0));

    const backgroundClasses = {
      default: "bg-secondary",
      warm: "bg-border", // Warm limestone background
    };

    const fillClasses = {
      default: "bg-primary",
      warm: "bg-accent", // Warm amber fill
    };

    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div
          ref={ref}
          className={cn(
            "relative h-2 w-full overflow-hidden rounded-full transition-all duration-300",
            backgroundClasses[variant]
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full w-full flex-1 transition-all duration-300 ease-out rounded-full",
              fillClasses[variant]
            )}
            style={{ transform: `translateX(-${100 - clampedValue}%)` }}
          />
        </div>

        {showText && (
          <span className="font-mono text-sm font-medium text-muted-foreground w-12 text-right">
            {clampedValue.toFixed(0)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
