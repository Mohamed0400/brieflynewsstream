"use client";

import { useEffect, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import type { MaintenanceStatus } from "@/lib/maintenance";
import { formatMaintenanceCountdown } from "@/lib/maintenance";

export function ConsoleMaintenanceBanner({ initial }: { initial: MaintenanceStatus }) {
  const { copy } = useConsoleCopy();
  const t = copy.maintenance;
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    setStatus(initial);
  }, [initial]);

  useEffect(() => {
    if (!status.scheduledAt || status.apiActive) return;
    const tick = () => {
      const scheduled = new Date(status.scheduledAt!);
      const diff = Math.ceil((scheduled.getTime() - Date.now()) / 1000);
      setStatus((current) => ({
        ...current,
        countdownSeconds: diff > 0 ? diff : null,
      }));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [status.scheduledAt, status.apiActive]);

  const showNotice = Boolean(status.notice?.trim());
  const showCountdown = !status.apiActive && status.countdownSeconds != null && status.countdownSeconds > 0;
  const showActive = status.apiActive;

  if (!showNotice && !showCountdown && !showActive) return null;

  return (
    <aside className="console-maintenance-banner" role="status" aria-live="polite">
      {showActive ? (
        <>
          <strong>{t.apiActiveTitle}</strong>
          <p>{status.apiMessage}</p>
        </>
      ) : null}
      {showNotice ? (
        <>
          <strong>{t.scheduledTitle}</strong>
          <p>{status.notice}</p>
        </>
      ) : null}
      {showCountdown ? (
        <p className="console-maintenance-countdown" dir="ltr">
          {t.countdown(formatMaintenanceCountdown(status.countdownSeconds!))}
        </p>
      ) : null}
    </aside>
  );
}
