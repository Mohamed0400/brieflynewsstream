"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    toast.exception(error, "This page could not be loaded.");
  }, [error]);

  return (
    <main className="page-shell" style={{ padding: "4rem var(--page-gutter)" }}>
      <h1>The page could not be loaded</h1>
      <p>{error.message || "An unexpected error occurred."}</p>
      <button type="button" className="console-primary-button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
