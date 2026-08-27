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
    "archive",
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
      titleAr?: string | null;
      titleEn?: string | null;
      arabic: { title: string | null; summary: string | null };
      english: { title: string | null; summary: string | null };
      translated: boolean;
    }>;
  };

  expect(payload.items.length, "seed bilingual fixtures with npm run seed:test").toBeGreaterThan(0);
  for (const article of payload.items) {
    expect(article.titleAr).toBeUndefined();
    expect(article.titleEn).toBeUndefined();
    expect(article.english.title).toMatch(new RegExp(fixtureQuery, "i"));
    expect(article.arabic.title, `missing Arabic title for ${article.english.title || article.title}`).toMatch(arabic);
    expect(article.english.title, `missing English title for ${article.arabic.title || article.title}`).toMatch(latin);
    expect(article.arabic.summary, "missing Arabic summary").toMatch(arabic);
    expect(article.english.summary, "missing English summary").toMatch(latin);
    expect(article.title).toMatch(arabic);
    expect(article.translated).toBe(true);
  }

  expect(today.ok()).toBeTruthy();
  const edition = await today.json() as {
    items: Array<{ arabic: { title: string | null }; english: { title: string | null } }>;
  };
  expect(edition.items.length).toBeGreaterThan(0);
  for (const article of edition.items) {
    expect(article.arabic.title).toMatch(arabic);
    expect(article.english.title).toMatch(latin);
  }
});

test("search engines can read robots.txt and sitemap.xml", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  const robotsBody = await robots.text();
  expect(robotsBody).toMatch(/Allow:\s*\//);
  expect(robotsBody).toMatch(/Allow:\s*\/favicon\.ico/);
  expect(robotsBody).toMatch(/Allow:\s*\/favicon-48x48\.png/);
  expect(robotsBody).toMatch(/Allow:\s*\/favicon-96x96\.png/);
  expect(robotsBody).toMatch(/Allow:\s*\/brand\//);
  expect(robotsBody).toMatch(/Disallow:\s*\/console/);
  expect(robotsBody).toMatch(/Disallow:\s*\/api/);
  expect(robotsBody).toMatch(/Sitemap:\s*https?:\/\/.+\//);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain("<urlset");
  expect(sitemapBody).toContain("/console/login");
  expect(sitemapBody).toContain("lang=en");
  expect(sitemapBody).toContain("hreflang=\"ar\"");
});

test("homepage icon tags use stable favicon URLs", async ({ request }) => {
  const home = await request.get("/");
  expect(home.ok()).toBeTruthy();
  const html = await home.text();
  expect(html).toContain('href="/favicon-48x48.png"');
  expect(html).toContain('href="/favicon-96x96.png"');
  expect(html).not.toMatch(/favicon\.ico\?favicon\./);
  expect(html).not.toMatch(/icon\.png\?icon\./);
  expect(html).not.toMatch(/apple-icon[^"]*\?/);
});

test("landing market-intelligence copy is native in Arabic and English", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "اعرف أي خبر يهم الأسواق" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "واجهة ذكاء أسواق للمنتجات التي تحتاج أن تفهم أي خبر يهم الأسواق.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "مصمّم لذكاء الأسواق" })).toBeVisible();

  await page.goto("/?lang=en");
  await expect(page.getByRole("heading", { name: "Know what news matters to markets" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Market intelligence API for products that need to understand what news matters to markets.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Built for market intelligence" })).toBeVisible();
  await expect(page.getByText("Other news API providers = more news.")).toBeVisible();
  await expect(page.locator(".mkt-demo-url code")).toHaveText("/api/v1/market-news?category=oil&region=global&sort=score");
});

test("pricing and developers pages switch language with ?lang=en", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1, name: "خطط واجهة برمجة أخبار الأسواق" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "مجاني" })).toBeVisible();

  await page.goto("/pricing?lang=en");
  await expect(page.getByRole("heading", { level: 1, name: "Market news API plans" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Free" })).toBeVisible();
  await expect(page.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "true");

  await page.goto("/developers");
  await expect(page.getByRole("heading", { level: 1, name: "واجهة API لأخبار الأسواق" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "ابدأ خلال 3 خطوات" })).toBeVisible();

  await page.goto("/developers?lang=en");
  await expect(page.getByRole("heading", { level: 1, name: "Market news API" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Start in 3 steps" })).toBeVisible();
  await expect(page.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "true");
});

test("homepage is Arabic-first and shows stored Arabic headlines", async ({ page }) => {
  await page.goto(`/news?q=${fixtureQuery}`);
  await expect(page.getByRole("heading", { name: "موجز الأسواق" })).toBeVisible();
  await expect(page.getByText("أخبار الأسواق العالمية خلال آخر 72 ساعة، مرتّبة حسب الأثر.")).toBeVisible();
  const firstHeadline = page.locator("main article h2 a").first();
  await expect(firstHeadline).toBeVisible();
  await expect(firstHeadline).toHaveText(arabic);
  await expect(page.getByText("فحص ثنائي اللغة البنوك المركزية تثبّت الفائدة مع استمرار التركيز على النفط")).toBeVisible();
});
