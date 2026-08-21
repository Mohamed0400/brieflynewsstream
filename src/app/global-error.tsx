"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/Toaster";
import { toast } from "@/lib/toast";
import { PUBLIC_PAGE_ERROR } from "@/lib/public-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error", error.digest ?? "unknown");
    toast.error(PUBLIC_PAGE_ERROR, "The application could not continue.");
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="page-shell" style={{ padding: "4rem 1.5rem" }}>
          <h1>The application could not continue</h1>
          <p>{PUBLIC_PAGE_ERROR}</p>
          {error.digest ? <p>Reference {error.digest}</p> : null}
          <button type="button" className="console-primary-button" onClick={() => reset()}>
            Reload
          </button>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
