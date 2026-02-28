import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HierarchicalQuickAddProps {
  title: string;
  placeholder: string;
  childPlaceholder?: string;
  onSubmit: (title: string, children?: string[]) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
  autoFocus?: boolean;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  disabled?: boolean;
  allowChildren?: boolean;
  maxChildren?: number;
  childrenLabel?: string;
}

export function HierarchicalQuickAdd({
  title,
  placeholder,
  childPlaceholder,
  onSubmit,
  onCancel,
  className,
  autoFocus = true,
  isExpanded: controlledExpanded,
  onToggle,
  disabled = false,
  allowChildren = true,
  maxChildren = 10,
  childrenLabel = "items",
}: HierarchicalQuickAddProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [mainValue, setMainValue] = useState("");
  const [children, setChildren] = useState<string[]>([]);
  const [currentChild, setCurrentChild] = useState("");
  const [showChildren, setShowChildren] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded ?? internalExpanded;
  const setExpanded = onToggle ?? setInternalExpanded;

  const handleToggle = () => {
    if (disabled) return;
    const newExpanded = !isExpanded;
    setExpanded(newExpanded);
    if (!newExpanded) {
      resetForm();
      onCancel?.();
    }
  };

  const resetForm = () => {
    setMainValue("");
    setChildren([]);
    setCurrentChild("");
    setShowChildren(false);
  };

  const handleSubmit = async () => {
    if (!mainValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const childrenToSubmit = children.length > 0 ? children : undefined;
      await onSubmit(mainValue.trim(), childrenToSubmit);
      resetForm();
      setExpanded(false);
    } catch (error) {
      console.error("Hierarchical quick add submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddChild = () => {
    if (!currentChild.trim() || children.length >= maxChildren) return;
    setChildren([...children, currentChild.trim()]);
    setCurrentChild("");
  };

  const handleRemoveChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleMainKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (allowChildren && !showChildren) {
        setShowChildren(true);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleToggle();
    }
  };

  const handleChildKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddChild();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowChildren(false);
    }
  };

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
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-serif">{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Input */}
                <div className="space-y-2">
                  <Input
                    placeholder={placeholder}
                    value={mainValue}
                    onChange={(e) => setMainValue(e.target.value)}
                    onKeyDown={handleMainKeyDown}
                    autoFocus={autoFocus}
                    disabled={isSubmitting}
                    className="text-lg h-12"
                  />
                  {allowChildren && mainValue.trim() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChildren(!showChildren)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {showChildren ? (
                        <ChevronDown className="w-4 h-4 mr-2" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      Add {childrenLabel} (optional)
                    </Button>
                  )}
                </div>

                {/* Children Section */}
                <AnimatePresence>
                  {showChildren && allowChildren && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-3 pl-4 border-l-2 border-border/30"
                    >
                      {/* Existing Children */}
                      {children.length > 0 && (
                        <div className="space-y-2">
                          {children.map((child, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="flex items-center gap-2"
                            >
                              <Badge
                                variant="secondary"
                                className="flex-1 justify-start"
                              >
                                {child}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveChild(index)}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Add Child Input */}
                      {children.length < maxChildren && (
                        <div className="flex gap-2">
                          <Input
                            placeholder={
                              childPlaceholder ||
                              `Add ${childrenLabel.slice(0, -1)}...`
                            }
                            value={currentChild}
                            onChange={(e) => setCurrentChild(e.target.value)}
                            onKeyDown={handleChildKeyDown}
                            disabled={isSubmitting}
                            className="h-8 text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={handleAddChild}
                            disabled={!currentChild.trim() || isSubmitting}
                            className="h-8"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

                      {children.length >= maxChildren && (
                        <p className="text-xs text-muted-foreground">
                          Maximum {maxChildren} {childrenLabel} reached
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={!mainValue.trim() || isSubmitting}
                    size="lg"
                    className={cn(
                      "flex-1",
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
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Create{" "}
                    {children.length > 0
                      ? `with ${children.length} ${childrenLabel}`
                      : ""}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleToggle}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Button
            onClick={handleToggle}
            disabled={disabled}
            size="lg"
            className="shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            {title}
          </Button>
        )}
      </AnimatePresence>
    </div>
  );
}
