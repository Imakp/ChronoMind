"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | undefined>(
  undefined
);

interface SheetProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Sheet = ({ children, open, onOpenChange }: SheetProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const show = isControlled ? open : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) setInternalOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <SheetContext.Provider
      value={{ open: !!show, onOpenChange: handleOpenChange }}
    >
      {children}
    </SheetContext.Provider>
  );
};

interface SheetTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

const SheetTrigger = ({ children }: SheetTriggerProps) => {
  const context = React.useContext(SheetContext);
  return <div onClick={() => context?.onOpenChange(true)}>{children}</div>;
};

interface SheetContentProps {
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
  children: React.ReactNode;
}

const SheetContent = ({
  side = "right",
  className,
  children,
}: SheetContentProps) => {
  const context = React.useContext(SheetContext);

  if (!context?.open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 animate-in fade-in duration-300"
        onClick={() => context.onOpenChange(false)}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out duration-300 animate-in",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm slide-in-from-left",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm slide-in-from-right",
          side === "top" && "inset-x-0 top-0 border-b slide-in-from-top",
          side === "bottom" &&
            "inset-x-0 bottom-0 border-t slide-in-from-bottom",
          className
        )}
      >
        {children}
      </div>
    </>
  );
};

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle };
