"use client";

import { useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { toast } from "@/lib/toast";

export function OpsCollectCta() {
  const { copy } = useConsoleCopy();
  const t = copy.opsOverview.collectCta;
  const [busy, setBusy] = useState(false);

  async function triggerCollect() {
    setBusy(true);
    try {
      const response = await fetch("/api/console/schedule/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: "collect", force: true }),
      });
      const payload = await response.json().catch(() => ({})) as {
        message?: string;
        run?: { ok: boolean; skipped: boolean; message: string };
      };
      if (!response.ok && !payload.run) {
        throw new Error(payload.message || t.failed);
      }
      const message = payload.run?.message;
      if (message) {
        if (!payload.run?.ok && !payload.run?.skipped) toast.error(message, t.failed);
        else if (payload.run?.skipped) toast.warning(message);
        else toast.success(message);
      }
    } catch (requestError) {
      toast.exception(requestError, t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="console-panel ops-collect-cta" aria-labelledby="ops-collect-cta-title">
      <div className="console-panel-heading">
        <div>
          <h2 id="ops-collect-cta-title">{t.title}</h2>
          <p>{t.hint}</p>
        </div>
        <button
          type="button"
          className="console-primary-button"
          disabled={busy}
          onClick={() => void triggerCollect()}
        >
          {busy ? t.running : t.button}
        </button>
      </div>
    </section>
  );
}
