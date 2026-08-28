"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function OpsNavProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setActive(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActive(false), 450);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [pathname]);

  return (
    <div className="ops-nav-progress" data-active={active ? "true" : "false"} aria-hidden="true">
      <span />
    </div>
  );
}
