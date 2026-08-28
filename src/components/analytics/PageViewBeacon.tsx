"use client";

import { useEffect, useRef } from "react";

export function PageViewBeacon({ locale, enabled = true }: { locale?: string; enabled?: boolean }) {
  const sent = useRef(false);

  useEffect(() => {
    if (!enabled || sent.current) return;
    sent.current = true;
    const path = `${window.location.pathname}${window.location.search}`;
    void fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path,
        locale: locale || document.documentElement.lang || "ar",
        referrer: document.referrer || "",
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [enabled, locale]);

  return null;
}
