import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface QuickAddFormProps {
  placeholder: string;
  buttonText: string;
  onSubmit: (value: string) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
  autoFocus?: boolean;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "inline";
}

export function QuickAddForm({
  placeholder,
  buttonText,
  onSubmit,
  onCancel,
  className,
  autoFocus = true,
  isExpanded: controlledExpanded,
  onToggle,
  disabled = false,
  size = "default",
  variant = "default",
}: QuickAddFormProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded ?? internalExpanded;
  const setExpanded = onToggle ?? setInternalExpanded;

  const handleToggle = () => {
    if (disabled) return;
    const newExpanded = !isExpanded;
    setExpanded(newExpanded);
    if (!newExpanded) {
      setValue("");
      onCancel?.();
    }
  };

  const handleSubmit = async () => {
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(value.trim());
      setValue("");
      setExpanded(false);
    } catch (error) {
      console.error("Quick add form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleToggle();
    }
  };

  const sizeClasses = {
    sm: {
      button: "h-8 px-3 text-sm",
      input: "h-8 text-sm",
      card: "p-3",
    },
    default: {
      button: "h-9 px-4",
      input: "h-9",
      card: "p-4",
    },
    lg: {
      button: "h-10 px-6",
      input: "h-10 text-lg",
      card: "p-6",
    },
  };

  const currentSize = sizeClasses[size];

  if (variant === "inline") {
    return (
      <div className={cn("space-y-2", className)}>
        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 items-center">
                <Input
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus={autoFocus}
                  disabled={isSubmitting}
                  className={currentSize.input}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!value.trim() || isSubmitting}
                  size={size === "sm" ? "sm" : "default"}
                  className={cn(
                    currentSize.button,
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size={size === "sm" ? "sm" : "default"}
                  onClick={handleToggle}
                  disabled={isSubmitting}
                  className={currentSize.button}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button
              variant="ghost"
              size={size}
              onClick={handleToggle}
              disabled={disabled}
              className={cn(
                "text-muted-foreground hover:text-primary w-full justify-start pl-0 hover:bg-transparent",
                currentSize.button
              )}
            >
              <Plus className="w-4 h-4 mr-2" />
              {buttonText}
            </Button>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={className}>
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-2 border-primary/10 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)] bg-secondary/5">
              <CardContent className={currentSize.card}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus={autoFocus}
                    disabled={isSubmitting}
                    className={cn("flex-1", currentSize.input)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={!value.trim() || isSubmitting}
                      size={size}
                      className={cn(
                        currentSize.button,
                        isSubmitting && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                        />
                      ) : null}
                      {buttonText}
                    </Button>
                    <Button
                      variant="ghost"
                      size={size}
                      onClick={handleToggle}
                      disabled={isSubmitting}
                      className={currentSize.button}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Button
            onClick={handleToggle}
            disabled={disabled}
            size={size === "lg" ? "lg" : "default"}
            className={cn("shadow-sm transition-all", currentSize.button)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {buttonText}
          </Button>
        )}
      </AnimatePresence>
    </div>
  );
}
