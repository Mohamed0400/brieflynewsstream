"use client";

import { useCallback, useEffect, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { OpsPanelSkeleton } from "@/components/console/ops/OpsCharts";
import { BrandLoader } from "@/components/media/BrandLoader";

type AuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorEmail: string;
  createdAt: string;
  metadata: unknown;
};

export function AdminAuditPanel() {
  const { copy } = useConsoleCopy();
  const t = copy.opsAudit;
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/console/admin/audit?limit=80");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || t.loadFailed);
      setItems(payload.items || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  function formatWhen(value: string) {
    return new Intl.DateTimeFormat(copy.locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kuwait",
    }).format(new Date(value));
  }

  return (
    <section className="console-panel ops-audit" aria-labelledby="ops-audit-title">
      <div className="console-panel-heading">
        <div>
          <h2 id="ops-audit-title">{t.title}</h2>
          <p>{t.hint}</p>
        </div>
        <button type="button" className="console-secondary-button" onClick={() => void load()}>
          {t.refresh}
        </button>
      </div>

      {loading ? (
        <div className="ops-panel-enter" aria-busy="true">
          <OpsPanelSkeleton rows={6} />
          <div className="ops-loading ops-loading-overlay">
            <BrandLoader size="sm" label={t.refresh} />
          </div>
        </div>
      ) : error ? (
        <p className="console-gate-error" role="alert">{error}</p>
      ) : !items.length ? (
        <p className="console-muted">{t.empty}</p>
      ) : (
        <div className="ops-customers-table-wrap">
          <table className="ops-customers-table">
            <thead>
              <tr>
                <th>{t.colWhen}</th>
                <th>{t.colActor}</th>
                <th>{t.colAction}</th>
                <th>{t.colTarget}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{formatWhen(row.createdAt)}</td>
                  <td dir="ltr">{row.actorEmail}</td>
                  <td><code className="console-ltr">{row.action}</code></td>
                  <td>
                    <span className="console-muted">{row.targetType}</span>
                    <code className="console-ltr">{row.targetId.slice(0, 12)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
