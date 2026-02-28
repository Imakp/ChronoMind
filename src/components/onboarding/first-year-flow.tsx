"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createYear } from "@/lib/actions";
import {
  Loader2,
  Sparkles,
  Calendar,
  Target,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { useOnboarding } from "@/components/providers/onboarding-provider";

interface FirstYearFlowProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FirstYearFlow({ userId, isOpen, onClose }: FirstYearFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { startTour } = useOnboarding();

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleCreateYear = async () => {
    startTransition(async () => {
      const result = await createYear(userId, selectedYear);
      if (result.success) {
        setStep(3);
        // Auto-advance to final step after a moment
        setTimeout(() => {
          onClose();
          router.push(`/year/${selectedYear}`);
          // Start the onboarding tour after navigation
          setTimeout(() => startTour(), 1000);
        }, 2000);
      } else {
        console.error("Failed to create year:", result.error);
      }
    });
  };

  const features = [
    {
      icon: Calendar,
      title: "Daily Logs",
      description: "Capture your daily thoughts and experiences",
    },
    {
      icon: Target,
      title: "Yearly Goals",
      description: "Set and track meaningful objectives",
    },
    {
      icon: BookOpen,
      title: "Book Notes",
      description: "Document your reading journey",
    },
    {
      icon: Lightbulb,
      title: "Lessons Learned",
      description: "Reflect on insights and growth",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {step === 1 && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-accent-foreground" />
            </div>

            <div className="space-y-3">
              <DialogTitle className="font-serif text-2xl font-semibold">
                Welcome to ChronoMind
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed">
                Your personal knowledge workspace organized by year. Let's
                create your first year to get started.
              </DialogDescription>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              {features.map((feature) => (
                <div key={feature.title} className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-secondary flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Create Your First Year
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <DialogTitle className="font-serif text-2xl font-semibold">
                Choose Your Year
              </DialogTitle>
              <DialogDescription>
                Select the year you want to start documenting. You can always
                add more years later.
              </DialogDescription>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">Select Year</label>
              <div className="grid grid-cols-5 gap-2">
                {yearOptions.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 font-mono text-sm ${
                      selectedYear === year
                        ? "border-accent bg-accent/10 text-accent-foreground"
                        : "border-border hover:border-accent/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isPending}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateYear}
                disabled={isPending}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create {selectedYear}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <DialogTitle className="font-serif text-2xl font-semibold text-green-700">
                Year {selectedYear} Created!
              </DialogTitle>
              <DialogDescription className="text-base">
                Taking you to your new workspace. We'll show you around with a
                quick tour.
              </DialogDescription>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing your workspace...
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
