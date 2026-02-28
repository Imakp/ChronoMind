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
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-300 ease-out"
        onClick={() => context.onOpenChange(false)}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed z-50 gap-4 bg-card p-8 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.05)] transition ease-out duration-300 animate-in border-none",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 sm:max-w-sm slide-in-from-left",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 sm:max-w-sm slide-in-from-right",
          side === "top" && "inset-x-0 top-0 slide-in-from-top",
          side === "bottom" && "inset-x-0 bottom-0 slide-in-from-bottom",
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
      "flex flex-col space-y-3 text-center sm:text-left mb-6",
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
    className={cn(
      "text-xl font-serif font-semibold text-foreground tracking-tight",
      className
    )}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle };
