"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type MarketingRevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: "section" | "div" | "p";
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className" | "style">;

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Lightweight scroll reveal (no Motion dependency).
 * Honors prefers-reduced-motion via CSS + subscribe snapshot.
 */
export function MarketingReveal({
  children,
  className = "",
  delayMs = 0,
  as: Tag = "div",
  ...rest
}: MarketingRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => true,
  );
  const [visible, setVisible] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const style: CSSProperties | undefined = delayMs
    ? ({ ["--mkt-reveal-delay" as string]: `${delayMs}ms` } as CSSProperties)
    : undefined;

  const shown = reduceMotion || visible;

  return (
    <Tag
      ref={ref as never}
      className={`mkt-reveal${shown ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
