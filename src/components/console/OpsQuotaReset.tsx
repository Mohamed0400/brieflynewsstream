"use client";

import { useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { toast } from "@/lib/toast";

type QuotaResetResult = {
  ok?: boolean;
  deleted?: number;
  message?: string;
};

async function postQuotaReset(body: Record<string, unknown>): Promise<QuotaResetResult> {
  const response = await fetch("/api/console/admin/quota-reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as QuotaResetResult & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || payload.error || "reset_failed");
  }
  return payload;
}

/** One-click reset for a single account's usage today (no phrase). */
export function AdminQuotaResetButton({
  accountId,
  email,
  onDone,
}: {
  accountId: string;
  email: string;
  onDone?: (deleted: number) => void;
}) {
  const { copy } = useConsoleCopy();
  const q = copy.opsQuota;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirmReset() {
    setBusy(true);
    try {
      const payload = await postQuotaReset({
        scope: "account",
        accountId,
        window: "today",
      });
      toast.success(q.success(payload.deleted || 0));
      setOpen(false);
      onDone?.(payload.deleted || 0);
    } catch (error) {
      toast.exception(error, q.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ops-quota-account-reset">
      {!open ? (
        <button type="button" className="console-danger-button" onClick={() => setOpen(true)}>
          {q.resetAccount}
        </button>
      ) : (
        <div className="ops-inline-confirm">
          <p>{q.confirmAccount(email)}</p>
          <div className="console-inline-actions">
            <button
              type="button"
              className="console-secondary-button"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              {q.cancel}
            </button>
            <button
              type="button"
              className="console-danger-button"
              disabled={busy}
              onClick={() => void confirmReset()}
            >
              {busy ? q.working : q.confirmButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Reset today's usage for every account — requires typing RESET QUOTA. */
export function AdminQuotaResetAllPanel() {
  const { copy } = useConsoleCopy();
  const q = copy.opsQuota;
  const [open, setOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [busy, setBusy] = useState(false);

  async function resetAllQuota() {
    if (confirmPhrase.trim() !== q.confirmPhrase) {
      toast.error(q.confirmPhraseLabel);
      return;
    }
    setBusy(true);
    try {
      const payload = await postQuotaReset({
        scope: "all",
        confirmPhrase: confirmPhrase.trim(),
        window: "today",
      });
      toast.success(q.success(payload.deleted || 0));
      setOpen(false);
      setConfirmPhrase("");
    } catch (error) {
      toast.exception(error, q.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="console-panel ops-danger-zone" aria-labelledby="ops-quota-title">
      <div className="console-panel-heading">
        <div>
          <h2 id="ops-quota-title">{q.resetAll}</h2>
          <p>{q.confirmAll}</p>
        </div>
      </div>
      {!open ? (
        <button type="button" className="console-danger-button" onClick={() => setOpen(true)}>
          {q.resetAllCta}
        </button>
      ) : (
        <div className="ops-inline-confirm">
          <label className="console-gate-field">
            <span>{q.confirmPhraseLabel}</span>
            <input
              className="console-input console-ltr"
              dir="ltr"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              autoComplete="off"
              placeholder={q.confirmPhrase}
            />
          </label>
          <div className="console-inline-actions">
            <button
              type="button"
              className="console-secondary-button"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setConfirmPhrase("");
              }}
            >
              {q.cancel}
            </button>
            <button
              type="button"
              className="console-danger-button"
              disabled={busy || confirmPhrase.trim() !== q.confirmPhrase}
              onClick={() => void resetAllQuota()}
            >
              {busy ? q.working : q.confirmButton}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
