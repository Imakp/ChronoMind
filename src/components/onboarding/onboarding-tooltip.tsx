"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useOnboarding } from "@/components/providers/onboarding-provider";
import { cn } from "@/lib/utils";

interface TooltipPosition {
  top: number;
  left: number;
  arrow: "top" | "bottom" | "left" | "right";
}

export function OnboardingTooltip() {
  const { state, nextStep, prevStep, skipTour, completeTour } = useOnboarding();
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = state.steps[state.currentStep];
  const isLastStep = state.currentStep === state.steps.length - 1;
  const isFirstStep = state.currentStep === 0;

  useEffect(() => {
    if (!state.tourActive || !currentStep) return;

    const updatePosition = () => {
      const targetElement = document.querySelector(currentStep.targetElement);
      if (!targetElement || !tooltipRef.current) return;

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;
      let arrow: "top" | "bottom" | "left" | "right" = "top";

      switch (currentStep.position) {
        case "bottom":
          top = targetRect.bottom + 12;
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
          arrow = "top";
          break;
        case "top":
          top = targetRect.top - tooltipRect.height - 12;
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
          arrow = "bottom";
          break;
        case "right":
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
          left = targetRect.right + 12;
          arrow = "left";
          break;
        case "left":
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
          left = targetRect.left - tooltipRect.width - 12;
          arrow = "right";
          break;
      }

      // Ensure tooltip stays within viewport
      if (left < 12) left = 12;
      if (left + tooltipRect.width > viewportWidth - 12) {
        left = viewportWidth - tooltipRect.width - 12;
      }
      if (top < 12) top = 12;
      if (top + tooltipRect.height > viewportHeight - 12) {
        top = viewportHeight - tooltipRect.height - 12;
      }

      setPosition({ top, left, arrow });
    };

    // Initial position calculation
    setTimeout(updatePosition, 100);

    // Update position on scroll/resize
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [state.tourActive, currentStep]);

  // Add highlight to target element
  useEffect(() => {
    if (!state.tourActive || !currentStep) return;

    const targetElement = document.querySelector(currentStep.targetElement);
    if (targetElement) {
      targetElement.classList.add("onboarding-highlight");

      // Scroll element into view
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }

    return () => {
      if (targetElement) {
        targetElement.classList.remove("onboarding-highlight");
      }
    };
  }, [state.tourActive, currentStep]);

  if (!state.tourActive || !currentStep || !position) return null;

  const handleNext = () => {
    if (isLastStep) {
      completeTour();
    } else {
      nextStep();
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <Card className="relative max-w-sm p-6 bg-surface border border-accent/30 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.2)]">
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-3 h-3 bg-surface border-accent/30 rotate-45",
              {
                "top-[-6px] left-1/2 transform -translate-x-1/2 border-t border-l":
                  position.arrow === "top",
                "bottom-[-6px] left-1/2 transform -translate-x-1/2 border-b border-r":
                  position.arrow === "bottom",
                "left-[-6px] top-1/2 transform -translate-y-1/2 border-l border-b":
                  position.arrow === "left",
                "right-[-6px] top-1/2 transform -translate-y-1/2 border-r border-t":
                  position.arrow === "right",
              }
            )}
          />

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={skipTour}
          >
            <X className="h-3 w-3" />
          </Button>

          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-foreground leading-tight">
                  {currentStep.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {state.steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors duration-300",
                      index <= state.currentStep ? "bg-accent" : "bg-border"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {state.currentStep + 1} of {state.steps.length}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="text-muted-foreground"
                >
                  Skip Tour
                </Button>
              </div>
              <Button
                size="sm"
                onClick={handleNext}
                className="gap-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isLastStep ? "Finish" : "Next"}
                {!isLastStep && <ArrowRight className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
