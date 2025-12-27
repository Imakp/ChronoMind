"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
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
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Something went wrong!
          </h2>
          <p className="text-muted-foreground">
            We apologize for the inconvenience. An unexpected error occurred.
          </p>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>
            <Button variant="outline" onClick={() => reset()}>
              Try again
            </Button>
          </div>
          {error.digest && (
            <code className="mt-4 text-xs text-muted-foreground bg-muted p-1 rounded">
              Ref: {error.digest}
            </code>
          )}
        </div>
      </body>
    </html>
  );
}
