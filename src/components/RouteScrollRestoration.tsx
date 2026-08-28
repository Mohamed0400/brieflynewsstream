"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function scrollToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function scrollToHashTarget() {
  const raw = window.location.hash.slice(1);
  if (!raw) return false;

  const id = decodeURIComponent(raw);
  const target =
    document.getElementById(id) ?? document.getElementsByName(id)[0] ?? null;
  if (!(target instanceof HTMLElement)) return false;

  target.scrollIntoView();
  return true;
}

/**
 * Next.js skips document scroll when a shared layout segment stays in the
 * viewport. Reset scroll on client-side pathname changes; preserve browser
 * back/forward restoration and hash targets.
 */
export function RouteScrollRestoration() {
  const pathname = usePathname();
  const skipNextScrollRef = useRef(false);
  const isInitialRenderRef = useRef(true);

  useEffect(() => {
    const onPopState = () => {
      skipNextScrollRef.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    if (skipNextScrollRef.current) {
      skipNextScrollRef.current = false;
      return;
    }

    if (scrollToHashTarget()) return;

    scrollToTop();
  }, [pathname]);

  return null;
}
