"use client";

import { useEffect, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { toast } from "@/lib/toast";

type SettingsPayload = {
  pageViewTracking: boolean;
  attributionCapture: boolean;
  maintenanceBanner: string;
  apiMaintenanceActive: boolean;
  apiMaintenanceMessage: string;
  apiMaintenanceScheduledAt: string | null;
  apiMaintenanceNotice: string;
};

export function AdminSettingsPanel() {
  const { copy } = useConsoleCopy();
  const t = copy.opsSettings;
  const q = copy.opsQuota;
  const [settings, setSettings] = useState<SettingsPayload>({
    pageViewTracking: true,
    attributionCapture: true,
    maintenanceBanner: "",
    apiMaintenanceActive: false,
    apiMaintenanceMessage:
      "Briefly NewsStream API is temporarily unavailable for scheduled maintenance. Please retry shortly.",
    apiMaintenanceScheduledAt: null,
    apiMaintenanceNotice: "",
  });
  const [busy, setBusy] = useState(false);
  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");

  useEffect(() => {
    void fetch("/api/console/admin/settings")
      .then((r) => r.json())
      .then((payload) => {
        if (payload.settings) setSettings((prev) => ({ ...prev, ...payload.settings }));
      })
      .catch(() => undefined);
  }, []);

  async function saveSettings() {
    setBusy(true);
    try {
      const response = await fetch("/api/console/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error(t.saveFailed);
      toast.success(t.saved);
    } catch {
      toast.error(t.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function resetAllQuota() {
    if (confirmPhrase.trim() !== q.confirmPhrase) {
      toast.error(q.confirmPhraseLabel);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/console/admin/quota-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scope: "all",
          confirmPhrase: confirmPhrase.trim(),
          window: "today",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || q.failed);
      toast.success(q.success(payload.deleted || 0));
      setResetAllOpen(false);
      setConfirmPhrase("");
    } catch (error) {
      toast.exception(error, q.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="console-panel" aria-labelledby="ops-settings-title">
        <div className="console-panel-heading">
          <div>
            <h2 id="ops-settings-title">{t.title}</h2>
            <p>{t.hint}</p>
          </div>
        </div>

        <div className="ops-settings-form">
          <label className="schedule-enable">
            <input
              type="checkbox"
              checked={settings.pageViewTracking}
              onChange={(e) => setSettings((s) => ({ ...s, pageViewTracking: e.target.checked }))}
            />
            {t.pageViewTracking}
          </label>
          <label className="schedule-enable">
            <input
              type="checkbox"
              checked={settings.attributionCapture}
              onChange={(e) => setSettings((s) => ({ ...s, attributionCapture: e.target.checked }))}
            />
            {t.attributionCapture}
          </label>
          <label className="console-gate-field">
            <span>{t.maintenanceBanner}</span>
            <input
              className="console-input"
              value={settings.maintenanceBanner}
              placeholder={t.maintenancePlaceholder}
              onChange={(e) => setSettings((s) => ({ ...s, maintenanceBanner: e.target.value }))}
            />
          </label>
          <label className="schedule-enable">
            <input
              type="checkbox"
              checked={settings.apiMaintenanceActive}
              onChange={(e) => setSettings((s) => ({ ...s, apiMaintenanceActive: e.target.checked }))}
            />
            {t.apiMaintenanceActive}
          </label>
          <label className="console-gate-field">
            <span>{t.apiMaintenanceNotice}</span>
            <input
              className="console-input"
              value={settings.apiMaintenanceNotice}
              placeholder="Maintenance is scheduled for Jul 8 at 2:00 PM UTC."
              onChange={(e) => setSettings((s) => ({ ...s, apiMaintenanceNotice: e.target.value }))}
            />
          </label>
          <label className="console-gate-field">
            <span>{t.apiMaintenanceScheduledAt}</span>
            <input
              className="console-input console-ltr"
              dir="ltr"
              type="datetime-local"
              value={settings.apiMaintenanceScheduledAt?.slice(0, 16) ?? ""}
              onChange={(e) => setSettings((s) => ({
                ...s,
                apiMaintenanceScheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null,
              }))}
              placeholder={t.apiMaintenanceScheduledPlaceholder}
            />
          </label>
          <label className="console-gate-field">
            <span>{t.apiMaintenanceMessage}</span>
            <textarea
              className="console-input"
              rows={3}
              value={settings.apiMaintenanceMessage}
              onChange={(e) => setSettings((s) => ({ ...s, apiMaintenanceMessage: e.target.value }))}
            />
          </label>
          <button type="button" className="console-primary-button" disabled={busy} onClick={() => void saveSettings()}>
            {busy ? t.saving : t.save}
          </button>
        </div>
      </section>

      <section className="console-panel ops-danger-zone" aria-labelledby="ops-quota-title">
        <div className="console-panel-heading">
          <div>
            <h2 id="ops-quota-title">{q.resetAll}</h2>
            <p>{q.confirmAll}</p>
          </div>
        </div>
        {!resetAllOpen ? (
          <button type="button" className="console-danger-button" onClick={() => setResetAllOpen(true)}>
            {q.resetAll}
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
              />
            </label>
            <div className="console-inline-actions">
              <button
                type="button"
                className="console-secondary-button"
                disabled={busy}
                onClick={() => {
                  setResetAllOpen(false);
                  setConfirmPhrase("");
                }}
              >
                {q.cancel}
              </button>
              <button type="button" className="console-danger-button" disabled={busy} onClick={() => void resetAllQuota()}>
                {busy ? q.working : q.confirmButton}
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export function AdminQuotaResetButton({
  accountId,
  email,
}: {
  accountId: string;
  email: string;
}) {
  const { copy } = useConsoleCopy();
  const q = copy.opsQuota;
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirmReset() {
    if (phrase.trim() !== q.confirmPhrase) {
      toast.error(q.confirmPhraseLabel);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/console/admin/quota-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scope: "account",
          accountId,
          confirmPhrase: phrase.trim(),
          window: "today",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || q.failed);
      toast.success(q.success(payload.deleted || 0));
      setOpen(false);
      setPhrase("");
    } catch (error) {
      toast.exception(error, q.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open ? (
        <button type="button" className="console-secondary-button" onClick={() => setOpen(true)}>
          {q.resetAccount}
        </button>
      ) : (
        <div className="ops-inline-confirm">
          <p>{q.confirmAccount(email)}</p>
          <label className="console-gate-field">
            <span>{q.confirmPhraseLabel}</span>
            <input
              className="console-input console-ltr"
              dir="ltr"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
            />
          </label>
          <div className="console-inline-actions">
            <button type="button" className="console-secondary-button" disabled={busy} onClick={() => setOpen(false)}>
              {q.cancel}
            </button>
            <button type="button" className="console-danger-button" disabled={busy} onClick={() => void confirmReset()}>
              {busy ? q.working : q.confirmButton}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
