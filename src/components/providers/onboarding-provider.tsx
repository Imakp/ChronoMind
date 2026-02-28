"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetElement: string;
  position: "top" | "bottom" | "left" | "right";
  action?: "click" | "type" | "navigate";
}

interface OnboardingState {
  isFirstVisit: boolean;
  currentStep: number;
  tourActive: boolean;
  completedSteps: string[];
  skippedTour: boolean;
  steps: OnboardingStep[];
}

interface OnboardingContextType {
  state: OnboardingState;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  setTourActive: (active: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to ChronoMind",
    description:
      "Let's take a quick tour of your personal knowledge workspace.",
    targetElement: "[data-onboarding='brand']",
    position: "bottom",
  },
  {
    id: "sections",
    title: "Navigate Your Sections",
    description:
      "Use these sections to organize different aspects of your year. Try pressing 1-7 for quick navigation!",
    targetElement: "[data-onboarding='navigation']",
    position: "right",
  },
  {
    id: "year-switcher",
    title: "Switch Between Years",
    description:
      "Access different years of your journal from this switcher in the top-right corner.",
    targetElement: "[data-onboarding='year-switcher']",
    position: "bottom",
  },
  {
    id: "daily-logs",
    title: "Daily Logs",
    description:
      "Capture your daily thoughts, experiences, and reflections here.",
    targetElement: "[data-onboarding='daily-logs']",
    position: "right",
  },
  {
    id: "goals",
    title: "Yearly Goals",
    description:
      "Set and track your goals with hierarchical tasks and progress visualization.",
    targetElement: "[data-onboarding='goals']",
    position: "right",
  },
  {
    id: "tagging",
    title: "Global Tagging System",
    description:
      "Highlight any text and add tags to create connections across your entire knowledge base.",
    targetElement: "[data-onboarding='tags']",
    position: "right",
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    description:
      "Press '?' anytime to see all available keyboard shortcuts for faster navigation.",
    targetElement: "[data-onboarding='shortcuts']",
    position: "top",
  },
];

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [state, setState] = useState<OnboardingState>({
    isFirstVisit: false,
    currentStep: 0,
    tourActive: false,
    completedSteps: [],
    skippedTour: false,
    steps: ONBOARDING_STEPS,
  });

  // Check if user needs onboarding
  useEffect(() => {
    if (session?.user?.id) {
      // In a real app, you'd fetch this from the database
      // For now, we'll check localStorage as a fallback
      const hasCompletedOnboarding = localStorage.getItem(
        `onboarding-completed-${session.user.id}`
      );
      const hasSkippedOnboarding = localStorage.getItem(
        `onboarding-skipped-${session.user.id}`
      );

      setState((prev) => ({
        ...prev,
        isFirstVisit: !hasCompletedOnboarding && !hasSkippedOnboarding,
        skippedTour: !!hasSkippedOnboarding,
      }));
    }
  }, [session?.user?.id]);

  const startTour = () => {
    setState((prev) => ({
      ...prev,
      tourActive: true,
      currentStep: 0,
    }));
  };

  const nextStep = () => {
    setState((prev) => {
      const nextStepIndex = prev.currentStep + 1;
      if (nextStepIndex >= prev.steps.length) {
        return {
          ...prev,
          tourActive: false,
          currentStep: 0,
        };
      }
      return {
        ...prev,
        currentStep: nextStepIndex,
        completedSteps: [
          ...prev.completedSteps,
          prev.steps[prev.currentStep].id,
        ],
      };
    });
  };

  const prevStep = () => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  };

  const skipTour = () => {
    if (session?.user?.id) {
      localStorage.setItem(`onboarding-skipped-${session.user.id}`, "true");
    }
    setState((prev) => ({
      ...prev,
      tourActive: false,
      skippedTour: true,
      isFirstVisit: false,
    }));
  };

  const completeTour = () => {
    if (session?.user?.id) {
      localStorage.setItem(`onboarding-completed-${session.user.id}`, "true");
    }
    setState((prev) => ({
      ...prev,
      tourActive: false,
      isFirstVisit: false,
      completedSteps: prev.steps.map((step) => step.id),
    }));
  };

  const setTourActive = (active: boolean) => {
    setState((prev) => ({
      ...prev,
      tourActive: active,
    }));
  };

  return (
    <OnboardingContext.Provider
      value={{
        state,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        completeTour,
        setTourActive,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
