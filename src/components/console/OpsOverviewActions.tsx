"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { ADMIN_AUDIT_PATH, ADMIN_RECOVERY_PATH, adminNavHref } from "@/lib/admin-app";
import { toast } from "@/lib/toast";

type Recommendation = {
  id: string;
  severity: "critical" | "warning" | "info";
  action: "kill_zombie" | "collect" | "translate" | "recovery" | "auto_heal" | "none";
};

type PipelinePayload = {
  recommendations: Recommendation[];
  pipeline: {
    stuckJobs: string[];
    runningJobs: string[];
    pendingTranslationArticles: number;
    pendingRawArticles: number;
    pendingFreshRawArticles: number;
    pendingStaleRawArticles: number;
    bilingualFreshOk: boolean;
    bilingualFreshMissingArabic: number;
    newestPublishedAt: string | null;
    newestPublishedAgeHours: number | null;
    collectLastStatus: string | null;
    collectLastRunAt: string | null;
    pipelineAutoHeal: boolean;
    pipelineAutoHealCollect: boolean;
  };
};

function formatAgeHours(hours: number | null, locale: string) {
  if (hours == null) return "—";
  if (hours < 1) return `<1h`;
  return `${hours.toLocaleString(locale, { maximumFractionDigits: 1 })}h`;
}

export function OpsOverviewActions() {
  const { copy, lang } = useConsoleCopy();
  const t = copy.opsOverview;
  const [data, setData] = useState<PipelinePayload | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/console/ops/recommendations");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || t.loadFailed);
      setData(payload as PipelinePayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.loadFailed);
    }
  }, [t.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  async function killZombies() {
    setBusy("zombie");
    try {
      const response = await fetch("/api/console/ops/release-locks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || t.killZombieFailed);
      if (payload.messages?.length) toast.success(payload.messages.join(" "));
      else toast.success(t.killZombieDone);
      await load();
    } catch (requestError) {
      toast.exception(requestError, t.killZombieFailed);
    } finally {
      setBusy("");
    }
  }

  async function triggerCollect() {
    setBusy("collect");
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
        throw new Error(payload.message || t.collectCta.failed);
      }
      const message = payload.run?.message;
      if (message) {
        if (!payload.run?.ok && !payload.run?.skipped) toast.error(message, t.collectCta.failed);
        else if (payload.run?.skipped) toast.warning(message);
        else toast.success(message);
      }
      await load();
    } catch (requestError) {
      toast.exception(requestError, t.collectCta.failed);
    } finally {
      setBusy("");
    }
  }

  async function runAutoHeal(withCollect = false) {
    setBusy(withCollect ? "heal-collect" : "heal");
    try {
      const response = await fetch("/api/console/ops/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ autoHeal: true, collect: withCollect }),
      });
      const payload = await response.json().catch(() => ({})) as {
        message?: string;
        messages?: string[];
      };
      if (!response.ok) throw new Error(payload.message || t.autoHealFailed);
      if (payload.messages?.length) toast.success(payload.messages.join(" "));
      else toast.success(t.autoHealDone);
      await load();
    } catch (requestError) {
      toast.exception(requestError, t.autoHealFailed);
    } finally {
      setBusy("");
    }
  }

  async function runSuggestedRecovery() {
    setBusy("recovery");
    try {
      const response = await fetch("/api/console/ops/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ forceLocks: true, normalize: true, translate: true }),
      });
      const payload = await response.json().catch(() => ({})) as {
        message?: string;
        messages?: string[];
      };
      if (!response.ok && !payload.messages) {
        throw new Error(payload.message || t.autoHealFailed);
      }
      if (payload.messages?.length) toast.success(payload.messages.join(" "));
      await load();
    } catch (requestError) {
      toast.exception(requestError, t.autoHealFailed);
    } finally {
      setBusy("");
    }
  }

  async function runSuggestedTranslate() {
    setBusy("translate");
    try {
      const response = await fetch("/api/console/ops/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ translate: true, forceLocks: false, normalize: false }),
      });
      const payload = await response.json().catch(() => ({})) as {
        message?: string;
        messages?: string[];
      };
      if (!response.ok && !payload.messages) {
        throw new Error(payload.message || t.autoHealFailed);
      }
      if (payload.messages?.length) toast.success(payload.messages.join(" "));
      await load();
    } catch (requestError) {
      toast.exception(requestError, t.autoHealFailed);
    } finally {
      setBusy("");
    }
  }

  function labelFor(id: string) {
    return t.recommendationLabels[id as keyof typeof t.recommendationLabels] || id;
  }

  const hasZombie = Boolean(data?.pipeline.stuckJobs.length);
  const ageLabel = formatAgeHours(data?.pipeline.newestPublishedAgeHours ?? null, copy.locale);

  return (
    <div className="ops-overview-actions">
      <section className="console-metric-grid" aria-label={t.pipelineMetricsAria}>
        <article className={`console-metric ${(data?.pipeline.newestPublishedAgeHours ?? 0) > 6 ? "console-metric-warn" : "console-metric-primary"}`}>
          <span>{t.newestAge}</span>
          <strong dir="ltr">{ageLabel}</strong>
          <small>{t.newestAgeHint}</small>
        </article>
        <article className={`console-metric ${data?.pipeline.pendingStaleRawArticles ? "console-metric-warn" : ""}`}>
          <span>{t.staleRaw}</span>
          <strong>{(data?.pipeline.pendingStaleRawArticles ?? 0).toLocaleString(copy.locale)}</strong>
          <small>{t.staleRawHint}</small>
        </article>
        <article className="console-metric">
          <span>{t.collectStatus}</span>
          <strong>{data?.pipeline.collectLastStatus || "—"}</strong>
          <small>{t.autoHealStatus(Boolean(data?.pipeline.pipelineAutoHeal))}</small>
        </article>
      </section>

      <section className="console-panel ops-collect-cta" aria-labelledby="ops-collect-cta-title">
        <div className="console-panel-heading">
          <div>
            <h2 id="ops-collect-cta-title">{t.collectCta.title}</h2>
            <p>{t.collectCta.hint}</p>
          </div>
          <div className="ops-overview-cta-row">
            <button
              type="button"
              className="console-secondary-button"
              disabled={Boolean(busy)}
              onClick={() => void runAutoHeal(false)}
            >
              {busy === "heal" ? t.collectCta.running : t.runAutoHeal}
            </button>
            <button
              type="button"
              className="console-danger-button"
              disabled={Boolean(busy)}
              onClick={() => void killZombies()}
            >
              {busy === "zombie" ? t.collectCta.running : t.killZombie}
            </button>
            <button
              type="button"
              className="console-primary-button"
              disabled={Boolean(busy)}
              onClick={() => void triggerCollect()}
            >
              {busy === "collect" ? t.collectCta.running : t.collectCta.button}
            </button>
          </div>
        </div>
        {hasZombie ? (
          <p className="ops-recommendation-urgent" role="status">
            {t.zombieHint(data!.pipeline.stuckJobs.join(", "))}
          </p>
        ) : null}
      </section>

      <section className="console-panel" aria-labelledby="ops-recs-title">
        <div className="console-panel-heading">
          <div>
            <h2 id="ops-recs-title">{t.recommendationsTitle}</h2>
            <p>{t.recommendationsHint}</p>
          </div>
          <div className="ops-overview-cta-row">
            <Link href={adminNavHref(ADMIN_AUDIT_PATH, lang)} className="console-secondary-button">
              {t.openAudit}
            </Link>
            <Link href={adminNavHref(ADMIN_RECOVERY_PATH, lang)} className="console-secondary-button">
              {t.openRecovery}
            </Link>
          </div>
        </div>
        {error ? <p className="console-gate-error" role="alert">{error}</p> : null}
        <ul className="ops-recommendation-tags">
          {(data?.recommendations ?? []).map((rec) => (
            <li key={rec.id} data-severity={rec.severity}>
              <span className="ops-recommendation-tag">{labelFor(rec.id)}</span>
              {rec.action === "kill_zombie" ? (
                <button
                  type="button"
                  className="console-danger-button"
                  disabled={Boolean(busy)}
                  onClick={() => void killZombies()}
                >
                  {t.killZombie}
                </button>
              ) : null}
              {rec.action === "auto_heal" ? (
                <button
                  type="button"
                  className="console-primary-button"
                  disabled={Boolean(busy)}
                  onClick={() => void runAutoHeal(false)}
                >
                  {t.runAutoHeal}
                </button>
              ) : null}
              {rec.action === "collect" ? (
                <button
                  type="button"
                  className="console-primary-button"
                  disabled={Boolean(busy)}
                  onClick={() => void triggerCollect()}
                >
                  {t.collectCta.button}
                </button>
              ) : null}
              {rec.action === "translate" ? (
                <button
                  type="button"
                  className="console-secondary-button"
                  disabled={Boolean(busy)}
                  onClick={() => void runSuggestedTranslate()}
                >
                  {busy === "translate" ? t.collectCta.running : t.drainTranslations}
                </button>
              ) : null}
              {rec.action === "recovery" ? (
                <button
                  type="button"
                  className="console-secondary-button"
                  disabled={Boolean(busy)}
                  onClick={() => void runSuggestedRecovery()}
                >
                  {busy === "recovery" ? t.collectCta.running : t.applyRecovery}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
