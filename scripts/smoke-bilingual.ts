const baseUrl = (process.env.BASE_URL || process.env.PRODUCTION_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

type Coverage = {
  scanned: number;
  complete: number;
  missingArabic: number;
  missingEnglish: number;
  ok: boolean;
};

type Health = {
  status: string;
  ready?: boolean;
  checks?: { database?: string; jobs?: string; bilingual?: string; scheduler?: string };
  jobs?: Array<{ key: string; enabled: boolean; cron: string }>;
  bilingual?: { today: Coverage; fresh: Coverage };
};

async function fetchHealth(baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/v1/health`);
  const health = await response.json() as Health;
  return { response, health };
}

async function main() {
  const problems: string[] = [];
  let response: Response | undefined;
  let health: Health | undefined;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    ({ response, health } = await fetchHealth(baseUrl));
    if (health.checks?.scheduler !== "offline" || attempt === 4) break;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (!response || !health) {
    console.error(`Smoke failed against ${baseUrl}`);
    console.error("- health request did not complete");
    process.exitCode = 1;
    return;
  }

  const jobs = health.jobs ?? [];
  const keys = jobs.map((job) => job.key).sort();
  const fresh = health.bilingual?.fresh;
  const today = health.bilingual?.today;

  if (!response.ok) problems.push(`health HTTP ${response.status} (${health.status})`);
  if (health.checks?.database !== "ok") problems.push("database check failed");
  if (keys.join(",") !== "collect,publish-daily,translate") {
    problems.push(`cron jobs missing, found: ${keys.join(", ") || "none"}`);
  }
  if (jobs.some((job) => !job.enabled)) problems.push("one or more cron jobs are disabled");
  if (!["online", "external"].includes(health.checks?.scheduler ?? "")) {
    problems.push("scheduler is offline");
  }
  if (!fresh || fresh.scanned === 0) {
    problems.push("no fresh articles in the live window");
  } else if (!fresh.ok) {
    problems.push(`fresh articles are not fully bilingual (${fresh.complete}/${fresh.scanned}; missing ar=${fresh.missingArabic} en=${fresh.missingEnglish})`);
  }
  if (today && today.scanned > 0 && !today.ok) {
    problems.push(`today's articles are not fully bilingual (${today.complete}/${today.scanned})`);
  }

  if (problems.length) {
    console.error(`Smoke failed against ${baseUrl}`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    status: health.status,
    ready: health.ready,
    jobs: jobs.map((job) => ({ key: job.key, cron: job.cron })),
    fresh,
    today,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
