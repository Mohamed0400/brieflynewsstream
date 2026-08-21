"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";
import { PUBLIC_PAGE_ERROR } from "@/lib/public-error";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error", error.digest ?? "unknown");
    toast.error(PUBLIC_PAGE_ERROR, "This page could not be loaded.");
  }, [error]);

  return (
    <main className="page-shell" style={{ padding: "4rem var(--page-gutter)" }}>
      <h1>The page could not be loaded</h1>
      <p>{PUBLIC_PAGE_ERROR}</p>
      {error.digest ? <p>Reference {error.digest}</p> : null}
      <button type="button" className="console-primary-button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
