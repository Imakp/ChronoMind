"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
            Unable to load this section
        </h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred while loading this content."}
        </p>
        <Button onClick={() => reset()} variant="outline" className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  );
}
