import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "warm";
}

/**
 * Modern Atelier Progress Bar with warm amber fill and smooth animations
 *
 * Features:
 * - Warm amber fill (hsl(35 60% 85%))
 * - Smooth 300ms transitions
 * - Text display inside bar when progress > 20%, outside right when <= 20%
 * - Multiple sizes and variants
 */
export function ProgressBar({
  value,
  className,
  showText = true,
  size = "md",
  variant = "warm",
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const variantClasses = {
    default: "bg-muted",
    warm: "bg-border", // Warm limestone background
  };

  const fillVariantClasses = {
    default: "bg-primary",
    warm: "bg-accent", // Warm amber fill
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex-1 rounded-full overflow-hidden transition-all duration-300",
          sizeClasses[size],
          variantClasses[variant]
        )}
      >
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full",
            fillVariantClasses[variant]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>

      {showText && (
        <span
          className={cn(
            "font-mono font-medium text-muted-foreground transition-all duration-300",
            textSizeClasses[size],
            clampedValue > 20 ? "ml-0" : "ml-2"
          )}
        >
          {clampedValue.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

interface AnimatedProgressBarProps extends ProgressBarProps {
  animationDelay?: number;
}

/**
 * Progress bar with entrance animation
 */
export function AnimatedProgressBar({
  animationDelay = 0,
  ...props
}: AnimatedProgressBarProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [animationDelay]);

  return (
    <div
      className={cn(
        "transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      <ProgressBar {...props} />
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
}

/**
 * Circular progress indicator with warm amber styling
 */
export function CircularProgress({
  value,
  size = 40,
  strokeWidth = 3,
  className,
  showText = true,
}: CircularProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--accent))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {showText && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-medium text-muted-foreground">
          {clampedValue.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
