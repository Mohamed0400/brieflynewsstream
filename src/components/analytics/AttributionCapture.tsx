"use client";

import { useEffect } from "react";
import {
  ATTRIBUTION_COOKIE,
  buildAttributionPayload,
  parseAttributionSearchParams,
  serializeAttributionCookie,
} from "@/lib/attribution";

const MAX_AGE = 60 * 60 * 24 * 30;

export function AttributionCapture({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const params = new URLSearchParams(window.location.search);
    const hasUtm = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .some((key) => params.has(key));

    let existing: ReturnType<typeof buildAttributionPayload> | null = null;
    try {
      const match = document.cookie.match(new RegExp(`${ATTRIBUTION_COOKIE}=([^;]+)`));
      if (match?.[1]) {
        existing = buildAttributionPayload(JSON.parse(decodeURIComponent(match[1])));
      }
    } catch {
      existing = null;
    }

    if (!hasUtm && existing?.utmSource) return;

    const parsed = parseAttributionSearchParams(params);
    const payload = buildAttributionPayload({
      ...parsed,
      referrer: document.referrer || existing?.referrer || "",
      landingPath: existing?.landingPath || `${window.location.pathname}${window.location.search}`,
    });

    document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(serializeAttributionCookie(payload))}; path=/; max-age=${MAX_AGE}; samesite=lax`;
  }, [enabled]);

  return null;
}
