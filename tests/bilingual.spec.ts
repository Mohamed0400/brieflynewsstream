import { expect, test } from "@playwright/test";

const apiHeaders = { "X-API-Key": process.env.API_KEY || "test-market-news-key" };
const arabic = /[\u0600-\u06ff]/;
const latin = /[A-Za-z]{2,}/;
const fixtureQuery = "E2EBILINGUAL";

test("health endpoint reports cron jobs and bilingual coverage", async ({ request }) => {
  const response = await request.get("/api/v1/health");
  const health = await response.json() as {
    checks: { jobs: string; bilingual: string; database: string };
    jobs: Array<{ key: string; enabled: boolean; cron: string }>;
    bilingual: {
      today: { scanned: number };
      fresh: { scanned: number };
    };
  };

  expect(health.checks.database).toBe("ok");
  expect(health.checks.jobs).toBe("ok");
  expect(health.jobs.map((job) => job.key).sort()).toEqual([
    "collect",
    "publish-daily",
    "translate",
  ]);
  expect(health.jobs.every((job) => job.enabled)).toBe(true);
  expect(health.jobs.every((job) => job.cron.trim().split(/\s+/).length === 5)).toBe(true);
  expect(health.bilingual.fresh.scanned).toBeGreaterThan(0);
  expect(health.bilingual.today.scanned).toBeGreaterThan(0);
});

test("API stores each daily article in Arabic and English", async ({ request }) => {
  const [feed, today] = await Promise.all([
    request.get(`/api/v1/market-news?lang=ar&q=${fixtureQuery}&limit=20`, { headers: apiHeaders }),
    request.get(`/api/v1/market-news/today?lang=ar&q=${fixtureQuery}`, { headers: apiHeaders }),
  ]);
  expect(feed.ok()).toBeTruthy();
  const payload = await feed.json() as {
    items: Array<{
      title: string;
      titleAr: string | null;
      titleEn: string | null;
      summaryAr: string | null;
      summaryEn: string | null;
      translated: boolean;
    }>;
  };

  expect(payload.items.length, "seed bilingual fixtures with npm run seed:test").toBeGreaterThan(0);
  for (const article of payload.items) {
    expect(article.titleEn).toMatch(new RegExp(fixtureQuery, "i"));
    expect(article.titleAr, `missing Arabic title for ${article.titleEn || article.title}`).toMatch(arabic);
    expect(article.titleEn, `missing English title for ${article.titleAr || article.title}`).toMatch(latin);
    expect(article.summaryAr, "missing Arabic summary").toMatch(arabic);
    expect(article.summaryEn, "missing English summary").toMatch(latin);
    expect(article.title).toMatch(arabic);
    expect(article.translated).toBe(true);
  }

  expect(today.ok()).toBeTruthy();
  const edition = await today.json() as {
    items: Array<{ titleAr: string | null; titleEn: string | null }>;
  };
  expect(edition.items.length).toBeGreaterThan(0);
  for (const article of edition.items) {
    expect(article.titleAr).toMatch(arabic);
    expect(article.titleEn).toMatch(latin);
  }
});

test("search engines can read robots.txt and sitemap.xml", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  const robotsBody = await robots.text();
  expect(robotsBody).toMatch(/Allow:\s*\//);
  expect(robotsBody).toMatch(/Disallow:\s*\/console/);
  expect(robotsBody).toMatch(/Disallow:\s*\/api/);
  expect(robotsBody).toMatch(/Sitemap:\s*https?:\/\/.+\//);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain("<urlset");
  expect(sitemapBody).toContain("lang=en");
  expect(sitemapBody).toContain("hreflang=\"ar\"");
});

test("homepage is Arabic-first and shows stored Arabic headlines", async ({ page }) => {
  await page.goto(`/?q=${fixtureQuery}`);
  await expect(page.getByRole("heading", { name: "موجز الأسواق" })).toBeVisible();
  await expect(page.getByText("أحدث أخبار الذهب والأسواق المالية، في مكان واحد.")).toBeVisible();
  const firstHeadline = page.locator("main article h2 a").first();
  await expect(firstHeadline).toBeVisible();
  await expect(firstHeadline).toHaveText(arabic);
  await expect(page.getByText("فحص ثنائي اللغة أسعار الذهب في الكويت مستقرة مع تراجع الدولار")).toBeVisible();
});
