"use client";

import { useEffect, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { AdminQuotaResetAllPanel } from "@/components/console/OpsQuotaReset";
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

      <AdminQuotaResetAllPanel />
    </>
  );
}
