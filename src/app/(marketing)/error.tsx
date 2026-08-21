"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";
import { PUBLIC_PAGE_ERROR } from "@/lib/public-error";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketing error", error.digest ?? "unknown");
    toast.error(PUBLIC_PAGE_ERROR, "This page could not be loaded.");
  }, [error]);

  return (
    <div className="mkt-section">
      <div className="mkt-section-head">
        <h1>The page could not be loaded</h1>
        <p>{PUBLIC_PAGE_ERROR}</p>
        {error.digest ? <p>Reference {error.digest}</p> : null}
      </div>
      <button type="button" className="mkt-btn mkt-btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
