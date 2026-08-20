"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/Toaster";
import { toast } from "@/lib/toast";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    toast.exception(error, "The application could not continue.");
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="page-shell" style={{ padding: "4rem 1.5rem" }}>
          <h1>The application could not continue</h1>
          <p>{error.message || "An unexpected error occurred."}</p>
          <button type="button" className="console-primary-button" onClick={() => reset()}>
            Reload
          </button>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
