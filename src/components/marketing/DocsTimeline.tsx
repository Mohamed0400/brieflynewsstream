"use client";

import { useEffect, useState } from "react";

type TimelineItem = {
  href: string;
  label: string;
};

export function DocsTimeline({
  label,
  items,
}: {
  label: string;
  items: readonly TimelineItem[];
}) {
  const [active, setActive] = useState(items[0]?.href ?? "");

  useEffect(() => {
    const sync = () => {
      const marker = 140;
      let current = items[0]?.href ?? "";
      for (const item of items) {
        const el = document.getElementById(item.href.replace("#", ""));
        if (!el) continue;
        if (el.getBoundingClientRect().top - marker <= 0) current = item.href;
      }
      setActive(current);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, [items]);

  return (
    <nav className="mkt-docs-toc" aria-label={label}>
      <p>{label}</p>
      <ol>
        {items.map((item, index) => {
          const n = String(index + 1).padStart(2, "0");
          const isActive = active === item.href;
          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={isActive ? "location" : undefined}
                onClick={() => setActive(item.href)}
              >
                <span className="mkt-docs-toc-n" aria-hidden="true">
                  {n}
                </span>
                <span className="mkt-docs-toc-label">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
