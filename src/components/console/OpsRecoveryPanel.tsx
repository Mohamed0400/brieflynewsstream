"use client";

import { useCallback, useEffect, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { OpsPanelSkeleton } from "@/components/console/ops/OpsCharts";
import { BrandLoader } from "@/components/media/BrandLoader";
import { toast } from "@/lib/toast";
import type { OpsRecoverResult, OpsStatusSnapshot } from "@/lib/ops-recovery";

const HIGHLIGHT_JOB_KEYS = new Set(["collect", "translate"]);

function formatStamp(value: string | null, locale: string, neverLabel: string) {
  if (!value) return neverLabel;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuwait",
  }).format(new Date(value));
}

function ratio(complete: number, scanned: number, locale: string) {
  if (!scanned) return "—";
  const pct = Math.round((complete / scanned) * 100);
  return `${complete.toLocaleString(locale)}/${scanned.toLocaleString(locale)} (${pct}%)`;
}

export function OpsRecoveryPanel() {
  const { copy } = useConsoleCopy();
  const t = copy.opsRecovery;
  const [status, setStatus] = useState<OpsStatusSnapshot | null>(null);
  const [lastResult, setLastResult] = useState<OpsRecoverResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/console/ops/status");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || t.loadFailed);
      setStatus(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runRecover(body: Record<string, boolean>, label: string) {
    setBusy(label);
    setError("");
    try {
      const response = await fetch("/api/console/ops/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok && !payload.messages) {
        throw new Error(payload.message || t.recoverFailed);
      }
      setLastResult(payload as OpsRecoverResult);
      if (payload.messages?.length) {
        toast.success(payload.messages.join(" "));
      }
      await load();
    } catch (requestError) {
      toast.exception(requestError, t.recoverFailed);
    } finally {
      setBusy("");
    }
  }

  async function releaseLocks(force = false) {
    setBusy("release");
    setError("");
    try {
      const response = await fetch("/api/console/ops/release-locks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || t.releaseFailed);
      if (payload.status) setStatus(payload.status);
      if (payload.messages?.length) toast.success(payload.messages.join(" "));
      await load();
    } catch (requestError) {
      toast.exception(requestError, t.releaseFailed);
    } finally {
      setBusy("");
    }
  }

  const stuckCount = status?.stuckJobs.length ?? 0;
  const highlightKeys = HIGHLIGHT_JOB_KEYS;

  return (
    <div className="ops-recovery-workspace">
      <section className="console-metric-grid" aria-label={t.metricsAria}>
        <article className={`console-metric ${stuckCount ? "console-metric-warn" : ""}`}>
          <span>{t.stuckJobs}</span>
          <strong>{stuckCount.toLocaleString(copy.locale)}</strong>
          <small>{stuckCount ? status!.stuckJobs.join(", ") : t.noStuckJobs}</small>
        </article>
        <article className="console-metric">
          <span>{t.rawBacklog}</span>
          <strong>{(status?.pendingRawArticles ?? 0).toLocaleString(copy.locale)}</strong>
          <small>{t.rawBacklogHint}</small>
        </article>
        <article className="console-metric">
          <span>{t.translationPending}</span>
          <strong>{(status?.pendingTranslationArticles ?? 0).toLocaleString(copy.locale)}</strong>
          <small>{t.translationPendingHint}</small>
        </article>
        <article className="console-metric console-metric-primary">
          <span>{t.bilingualFresh}</span>
          <strong dir="ltr">
            {status
              ? ratio(status.bilingual.fresh.complete, status.bilingual.fresh.scanned, copy.locale)
              : "—"}
          </strong>
          <small>
            {status
              ? t.bilingualToday(
                ratio(status.bilingual.today.complete, status.bilingual.today.scanned, copy.locale),
              )
              : t.bilingualFreshHint}
          </small>
        </article>
      </section>

      <section className="console-panel" aria-labelledby="ops-recovery-actions">
        <div className="console-panel-heading">
          <div>
            <h2 id="ops-recovery-actions">{t.actionsTitle}</h2>
            <p>{t.actionsHint}</p>
          </div>
          <button
            type="button"
            className="console-secondary-button"
            disabled={Boolean(busy)}
            onClick={() => void load()}
          >
            {t.refresh}
          </button>
        </div>
        <div className="ops-recovery-actions">
          <button
            type="button"
            className="console-secondary-button"
            disabled={Boolean(busy)}
            onClick={() => void releaseLocks(true)}
          >
            {busy === "release" ? t.working : t.releaseLocks}
          </button>
          <button
            type="button"
            className="console-secondary-button"
            disabled={Boolean(busy)}
            onClick={() => void runRecover({ normalize: true, forceLocks: false, translate: false }, "normalize")}
          >
            {busy === "normalize" ? t.working : t.drainNormalize}
          </button>
          <button
            type="button"
            className="console-secondary-button"
            disabled={Boolean(busy)}
            onClick={() => void runRecover({ translate: true, forceLocks: false, normalize: false }, "translate")}
          >
            {busy === "translate" ? t.working : t.drainTranslations}
          </button>
          <button
            type="button"
            className="console-primary-button"
            disabled={Boolean(busy)}
            onClick={() => void runRecover({ forceLocks: true, normalize: true, translate: true }, "full")}
          >
            {busy === "full" ? t.working : t.fullRecover}
          </button>
          <button
            type="button"
            className="console-secondary-button"
            disabled={Boolean(busy)}
            onClick={() => void runRecover({ collect: true, forceLocks: true }, "collect")}
          >
            {busy === "collect" ? t.working : t.forceCollect}
          </button>
          <button
            type="button"
            className="console-secondary-button"
            disabled={Boolean(busy)}
            onClick={() => void runRecover({ purgeQuality: true, forceLocks: false, normalize: false, translate: false }, "purge")}
          >
            {busy === "purge" ? t.working : t.purgeQuality}
          </button>
        </div>
        <p className="console-help">{t.vercelNote}</p>
      </section>

      {loading ? (
        <div className="ops-panel-enter" aria-busy="true">
          <OpsPanelSkeleton rows={5} />
          <div className="ops-loading ops-loading-overlay">
            <BrandLoader size="sm" label={t.loading} />
          </div>
        </div>
      ) : error ? (
        <p className="console-gate-error" role="alert">{error}</p>
      ) : status ? (
        <section className="console-panel ops-recovery-jobs" aria-labelledby="ops-recovery-jobs">
          <div className="console-panel-heading">
            <div>
              <h2 id="ops-recovery-jobs">{t.jobsTitle}</h2>
              <p>{t.jobsHint}</p>
            </div>
          </div>
          <div className="ops-customers-table-wrap">
            <table className="ops-customers-table">
              <thead>
                <tr>
                  <th>{t.colKey}</th>
                  <th>{t.colStatus}</th>
                  <th>{t.colLastRun}</th>
                  <th>{t.colSummary}</th>
                  <th>{t.colError}</th>
                </tr>
              </thead>
              <tbody>
                {status.jobs.map((job) => {
                  const highlight = highlightKeys.has(job.key) && job.running;
                  return (
                    <tr key={job.key} data-selected={highlight ? "true" : undefined}>
                      <td>
                        <code className="console-ltr">{job.key}</code>
                        {job.running ? (
                          <span className={`ops-pill ${job.stale ? "ops-pill-warn" : ""}`}>
                            {job.stale ? t.staleRunning : t.running}
                          </span>
                        ) : null}
                      </td>
                      <td>{job.lastStatus || t.idle}</td>
                      <td>{formatStamp(job.lastRunAt, copy.locale, t.never)}</td>
                      <td className="console-muted">{job.lastSummary || "—"}</td>
                      <td className="console-error">{job.lastError || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {lastResult ? (
        <section className="console-panel ops-recovery-result" aria-labelledby="ops-recovery-result">
          <div className="console-panel-heading">
            <div>
              <h2 id="ops-recovery-result">{t.lastResultTitle}</h2>
              <p>{formatStamp(lastResult.at, copy.locale, t.never)}</p>
            </div>
          </div>
          <ul className="ops-recovery-messages">
            {lastResult.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <p className="console-help">
            {t.remaining(
              lastResult.remaining.pendingRawArticles,
              lastResult.remaining.pendingTranslationArticles,
              lastResult.remaining.stuckJobs.length,
            )}
          </p>
        </section>
      ) : null}
    </div>
  );
}
