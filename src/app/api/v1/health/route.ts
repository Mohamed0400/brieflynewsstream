import { kuwaitDate } from "@/lib/market";
import { limits } from "@/lib/limits";
import { getBilingualCoverage } from "@/lib/article-translation";
import {
  DEFAULT_SCHEDULED_JOBS,
  getScheduleSnapshot,
} from "@/lib/scheduler";
import { API_TIMEZONE, DEFAULT_API_LANG, apiMeta, jsonApi } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const startedAt = Date.now();
  const freshnessHours = Math.max(1, limits.newsMaxAgeHours);
  const today = kuwaitDate();

  try {
    const [snapshot, todayCoverage, freshCoverage] = await Promise.all([
      getScheduleSnapshot(),
      getBilingualCoverage(new Date(`${today}T00:00:00+03:00`)),
      getBilingualCoverage(new Date(Date.now() - freshnessHours * 60 * 60 * 1000)),
    ]);

    const requiredKeys = DEFAULT_SCHEDULED_JOBS.map((job) => job.key);
    const requiredKeySet = new Set<string>(requiredKeys);
    const jobs = snapshot.jobs.map((job) => ({
      key: job.key,
      name: job.name,
      cron: job.cron,
      enabled: job.enabled,
      lastStatus: job.lastStatus,
      lastRunAt: job.lastRunAt,
      running: job.running,
    }));
    const missingJobs = requiredKeys.filter((key) => !jobs.some((job) => job.key === key));
    const disabledJobs = jobs.filter((job) => requiredKeySet.has(job.key) && !job.enabled).map((job) => job.key);
    const jobsOk = missingJobs.length === 0 && disabledJobs.length === 0;
    const bilingualOk = todayCoverage.ok && freshCoverage.ok;
    const schedulerOk = snapshot.scheduler.online;
    const ready = jobsOk && bilingualOk && schedulerOk;
    const healthy = jobsOk && bilingualOk;

    return jsonApi({
      status: healthy ? (ready ? "ok" : "degraded") : "error",
      ready,
      service: "market-news-api",
      ...apiMeta({ lang: DEFAULT_API_LANG, freshnessHours }),
      timezone: API_TIMEZONE,
      date: today,
      checks: {
        database: "ok",
        scheduler: schedulerOk ? "online" : "offline",
        jobs: jobsOk ? "ok" : "error",
        bilingual: bilingualOk ? "ok" : "error",
      },
      jobs,
      missingJobs,
      disabledJobs,
      bilingual: {
        today: todayCoverage,
        fresh: freshCoverage,
      },
      metrics: {
        freshArticles: freshCoverage.scanned,
        todaysArticles: todayCoverage.scanned,
        bilingualComplete: freshCoverage.complete,
      },
      latencyMs: Date.now() - startedAt,
    }, { status: healthy ? 200 : 503 }, origin);
  } catch {
    return jsonApi({
      status: "error",
      ready: false,
      service: "market-news-api",
      ...apiMeta({ lang: DEFAULT_API_LANG, freshnessHours }),
      timezone: API_TIMEZONE,
      date: today,
      checks: {
        database: "error",
        scheduler: "offline",
        jobs: "error",
        bilingual: "error",
      },
      latencyMs: Date.now() - startedAt,
    }, { status: 503 }, origin);
  }
}

export async function OPTIONS(request: Request) {
  return jsonApi(null, { status: 204 }, request.headers.get("origin"));
}
