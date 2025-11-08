"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "white",
          color: "#1f2937",
          border: "1px solid #e5e7eb",
        },
        className: "toast",
      }}
    />
  );
}
