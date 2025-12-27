"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AccordionContextValue = {
  value: string | undefined;
  onValueChange: (value: string) => void;
  type: "single" | "multiple";
};

const AccordionContext = React.createContext<AccordionContextValue | undefined>(
  undefined
);

// New: Context for the individual item to share its value with children
type AccordionItemContextValue = {
  value: string;
};

const AccordionItemContext = React.createContext<
  AccordionItemContextValue | undefined
>(undefined);

interface AccordionProps {
  type: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const Accordion = ({
  type,
  collapsible = false,
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: AccordionProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = controlledValue ?? internalValue;

  const handleValueChange = (newValue: string) => {
    if (type === "single") {
      const nextValue = value === newValue && collapsible ? "" : newValue;
      setInternalValue(nextValue);
      onValueChange?.(nextValue);
    }
  };

  return (
    <AccordionContext.Provider
      value={{ value, onValueChange: handleValueChange, type }}
    >
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
};

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => (
  <AccordionItemContext.Provider value={{ value }}>
    <div
      ref={ref}
      className={cn("border-b", className)}
      data-value={value}
      {...props}
    >
      {children}
    </div>
  </AccordionItemContext.Provider>
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(AccordionContext);
  const itemContext = React.useContext(AccordionItemContext);

  if (!itemContext) {
    throw new Error("AccordionTrigger must be used within an AccordionItem");
  }

  const isOpen = context?.value === itemContext.value;

  return (
    <button
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      data-state={isOpen ? "open" : "closed"}
      onClick={() => context?.onValueChange(itemContext.value)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(AccordionContext);
  const itemContext = React.useContext(AccordionItemContext);

  if (!itemContext) {
    throw new Error("AccordionContent must be used within an AccordionItem");
  }

  const isOpen = context?.value === itemContext.value;

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </div>
  );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
