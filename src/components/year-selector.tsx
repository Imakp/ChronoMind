"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createYear } from "@/lib/actions";
import type { Year } from "@prisma/client";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";

interface YearSelectorProps {
  currentYear?: number;
  availableYears: Year[];
  userId: string;
}

export default function YearSelector({
  availableYears,
  userId,
}: YearSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [yearToCreate, setYearToCreate] = useState<number>(
    new Date().getFullYear()
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Generate options for the dropdown (Current Year ± 5)
  const currentYearValue = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 11 },
    (_, i) => currentYearValue - 5 + i
  );

  const handleCreateYear = async () => {
    // If year exists, just navigate
    if (availableYears.some((y) => y.year === yearToCreate)) {
      router.push(`/year/${yearToCreate}`);
      setIsDialogOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await createYear(userId, yearToCreate);
      if (result.success) {
        setIsDialogOpen(false);
        router.push(`/year/${yearToCreate}`);
      } else {
        console.error("Failed to create year:", result.error);
        // Ideally show a toast here
      }
    });
  };

  // Sort years descending (newest first)
  const sortedYears = [...availableYears].sort((a, b) => b.year - a.year);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="font-serif text-5xl md:text-6xl font-medium tracking-tight text-foreground">
          ChronoMind
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Construct your life&apos;s database. One year at a time.
        </p>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Existing Year Cards */}
        {sortedYears.map((year) => (
          <Link
            key={year.id}
            href={`/year/${year.year}`}
            className="block h-full"
          >
            <Card className="group h-48 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-md bg-card border-border/60 hover:-translate-y-1">
              <span className="font-serif text-4xl md:text-5xl font-medium text-foreground group-hover:scale-105 transition-transform duration-300">
                {year.year}
              </span>
              <span className="mt-3 text-sm text-muted-foreground group-hover:text-primary transition-colors font-medium tracking-wide uppercase text-[10px]">
                View Journal
              </span>
            </Card>
          </Link>
        ))}

        {/* Create New Year Ghost Card */}
        <button
          onClick={() => setIsDialogOpen(true)}
          className="h-full w-full focus:outline-none"
        >
          <Card className="group h-48 flex flex-col items-center justify-center cursor-pointer border-dashed border-2 border-border hover:border-primary/50 hover:bg-secondary/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:bg-background group-hover:shadow-sm transition-all duration-300">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Create New Year
            </span>
          </Card>
        </button>
      </div>

      {/* Creation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Start a New Journey
            </DialogTitle>
            <DialogDescription>
              Select the year you want to document. This will create a fresh
              database for logs, goals, and reflections.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="grid gap-2">
              <label
                htmlFor="year"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Select Year
              </label>
              <select
                id="year"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                value={yearToCreate}
                onChange={(e) => setYearToCreate(parseInt(e.target.value))}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateYear} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {availableYears.some((y) => y.year === yearToCreate)
                ? "Open Year"
                : "Create Year"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
