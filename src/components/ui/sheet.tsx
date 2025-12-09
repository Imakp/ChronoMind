"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  children: React.ReactNode;
}

const Sheet = ({ children }: SheetProps) => {
  return <>{children}</>;
};

interface SheetTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

const SheetTrigger = ({ children }: SheetTriggerProps) => {
  return <>{children}</>;
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
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setIsOpen(true);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/80 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "top" && "inset-x-0 top-0 border-b",
          side === "bottom" && "inset-x-0 bottom-0 border-t",
          isOpen
            ? "translate-x-0"
            : side === "left"
            ? "-translate-x-full"
            : "translate-x-full",
          className
        )}
      >
        {children}
      </div>
    </>
  );
};

export { Sheet, SheetTrigger, SheetContent };
