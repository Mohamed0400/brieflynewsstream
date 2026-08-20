"use client";

import { FormEvent, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { toast } from "@/lib/toast";

type ScheduleJob = {
  key: string;
  name: string;
  description: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  running: boolean;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  lastSummary: string | null;
  presets: readonly { value: string; label: string }[];
};

export type ScheduleSnapshot = {
  timezone: string;
  scheduler: {
    online: boolean;
    processName: string | null;
    lastTickAt: string | null;
  };
  today: {
    date: string;
    exists: boolean;
    status: string;
    itemCount: number;
    updatedAt: string | null;
  };
  jobs: ScheduleJob[];
};

function formatStamp(value: string | null, locale: string, neverLabel: string) {
  if (!value) return neverLabel;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuwait",
  }).format(new Date(value));
}

function timezoneLabel(value: string) {
  return value.replace("/", "/\u200b");
}

export function SchedulePanel({ initial }: { initial: ScheduleSnapshot }) {
  const { copy } = useConsoleCopy();
  const text = copy.schedule;
  const [snapshot, setSnapshot] = useState(initial);
  const [customCron, setCustomCron] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState("");

  async function refreshFrom(response: Response) {
    const payload = await response.json() as ScheduleSnapshot & {
      message?: string;
      run?: { ok: boolean; skipped: boolean; message: string };
    };
    if (!response.ok && !payload.jobs) {
      throw new Error(payload.message || text.requestFailed);
    }
    if (payload.jobs) setSnapshot(payload);
    if (payload.run?.message) {
      if (!payload.run.ok && !payload.run.skipped) toast.error(payload.run.message, text.runFailed);
      else if (payload.run.skipped) toast.warning(payload.run.message);
      else toast.success(payload.run.message);
    }
    return payload;
  }

  async function patchJob(key: string, body: { cron?: string; enabled?: boolean }) {
    setBusyKey(key);
    try {
      const response = await fetch("/api/console/schedule", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, ...body }),
      });
      await refreshFrom(response);
      if (response.ok) toast.success(text.saved);
    } catch (requestError) {
      toast.exception(requestError, text.saveFailed);
    } finally {
      setBusyKey("");
    }
  }

  async function runJob(key: string) {
    setBusyKey(key);
    try {
      const response = await fetch("/api/console/schedule/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key }),
      });
      await refreshFrom(response);
    } catch (requestError) {
      toast.exception(requestError, text.runFailed);
    } finally {
      setBusyKey("");
    }
  }

  function submitCustomCron(event: FormEvent<HTMLFormElement>, key: string) {
    event.preventDefault();
    const cron = (customCron[key] ?? snapshot.jobs.find((job) => job.key === key)?.cron ?? "").trim();
    void patchJob(key, { cron });
  }

  const todayEmpty = !snapshot.today.exists || snapshot.today.itemCount === 0;

  function jobCopy(key: string) {
    return text.jobs[key as keyof typeof text.jobs];
  }

  function presetLabel(value: string, fallback: string) {
    return text.presets[value as keyof typeof text.presets] ?? fallback;
  }

  return (
    <div className="schedule-workspace">
      <section className="console-metric-grid" aria-label={text.statusAria}>
        <article className="console-metric console-metric-primary">
          <span>{text.todayEdition}</span>
          <strong>{snapshot.today.itemCount.toLocaleString(copy.locale)}</strong>
          <small>
            {snapshot.today.exists
              ? `${snapshot.today.date} · ${text.published}`
              : `${snapshot.today.date} · ${text.notPublished}`}
          </small>
        </article>
        <article className="console-metric">
          <span>{text.scheduler}</span>
          <strong className="console-word-metric">{snapshot.scheduler.online ? text.online : text.offline}</strong>
          <small>
            {snapshot.scheduler.online
              ? text.lastTick(formatStamp(snapshot.scheduler.lastTickAt, copy.locale, text.never))
              : text.keepRunning}
          </small>
        </article>
        <article className="console-metric">
          <span>{text.timezone}</span>
          <strong className="console-word-metric" dir="ltr">{timezoneLabel(snapshot.timezone)}</strong>
          <small>{text.timezoneHint}</small>
        </article>
      </section>

      {todayEmpty && (
        <aside className="schedule-empty-note">
          <strong>{text.todayEmptyTitle}</strong>
          <p>{text.todayEmptyBody}</p>
        </aside>
      )}

      {snapshot.jobs.map((job) => {
        const localized = jobCopy(job.key);
        const name = localized?.name ?? job.name;
        const description = localized?.description ?? job.description;
        return (
        <section key={job.key} className="console-panel schedule-job" aria-labelledby={`job-${job.key}`}>
          <div className="console-panel-heading">
            <div>
              <h2 id={`job-${job.key}`}>{name}</h2>
              <p>{description}</p>
            </div>
            <label className="schedule-enable">
              <input
                type="checkbox"
                checked={job.enabled}
                disabled={Boolean(busyKey)}
                onChange={(event) => void patchJob(job.key, { enabled: event.target.checked })}
              />
              {job.enabled ? text.enabled : text.paused}
            </label>
          </div>

          <div className="schedule-job-meta">
            <p><span>{text.cron}</span> <code>{job.cron}</code></p>
            <p><span>{text.lastRun}</span> {formatStamp(job.lastRunAt, copy.locale, text.never)}</p>
            <p><span>{text.status}</span> {job.lastStatus || text.idle}</p>
          </div>
          {job.lastSummary && <p className="console-help">{job.lastSummary}</p>}
          {job.lastError && <p className="console-error">{job.lastError}</p>}

          <div className="schedule-preset-row" role="group" aria-label={text.presetsAria(name)}>
            {job.presets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className="console-secondary-button"
                disabled={Boolean(busyKey)}
                aria-pressed={job.cron === preset.value}
                onClick={() => void patchJob(job.key, { cron: preset.value })}
              >
                {presetLabel(preset.value, preset.label)}
              </button>
            ))}
          </div>

          <form className="schedule-cron-form" onSubmit={(event) => submitCustomCron(event, job.key)}>
            <label className="explorer-field" htmlFor={`cron-${job.key}`}>
              <span>{text.customCron}</span>
              <input
                id={`cron-${job.key}`}
                className="console-input"
                value={customCron[job.key] ?? job.cron}
                onChange={(event) => setCustomCron((current) => ({ ...current, [job.key]: event.target.value }))}
                spellCheck={false}
                autoComplete="off"
                dir="ltr"
              />
            </label>
            <button type="submit" className="console-secondary-button" disabled={Boolean(busyKey)}>
              {text.saveCron}
            </button>
            <button
              type="button"
              className="console-primary-button"
              disabled={Boolean(busyKey)}
              onClick={() => void runJob(job.key)}
            >
              {busyKey === job.key || job.running ? text.running : text.runNow}
            </button>
          </form>
        </section>
        );
      })}
    </div>
  );
}
