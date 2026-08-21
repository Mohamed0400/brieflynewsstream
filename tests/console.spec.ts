import { expect, test } from "@playwright/test";

const e2eEmail = process.env.CONSOLE_E2E_EMAIL || "console-e2e@briefly.local";
const e2ePassword = process.env.CONSOLE_E2E_PASSWORD || "BrieflyE2E!2026";
const widths = [320, 360, 375, 768, 1024, 1440];

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/console/login?lang=en");
  await page.getByLabel("Email").fill(e2eEmail);
  await page.getByLabel("Password", { exact: true }).fill(e2ePassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/console\/overview$/, { timeout: 30_000 });
}

test("public dashboard metrics match API-backed records", async ({ page, request }) => {
  const headers = { "X-API-Key": process.env.API_KEY || "test-market-news-key" };
  const [newsResponse, sourcesResponse, editionResponse, countriesResponse] = await Promise.all([
    request.get("/api/v1/market-news?limit=1", { headers }),
    request.get("/api/v1/sources", { headers }),
    request.get("/api/v1/market-news/today", { headers }),
    request.get("/api/v1/meta/countries", { headers }),
  ]);
  const [news, sources, edition, countries] = await Promise.all([
    newsResponse.json(),
    sourcesResponse.json(),
    editionResponse.json(),
    countriesResponse.json(),
  ]);

  await page.goto("/?lang=en");
  const metric = (label: string) => page.locator("dl > div").filter({ hasText: label });
  await expect(metric("Fresh articles").locator("dd").first()).toHaveText(String(news.count));
  const storedValue = Number(await metric("All stored articles").locator("dd").first().textContent());
  expect(storedValue).toBeGreaterThanOrEqual(Number(news.count));
  await expect(metric("News sources").locator("dd").first()).toHaveText(
    `${sources.items.filter((source: { status: string }) => source.status === "healthy").length}/${sources.count}`,
  );
  await expect(metric("Today's brief").locator("dd").first()).toHaveText(String(edition.count ?? 0));
  await expect(metric("Countries with news").locator("dd").first()).toHaveText(
    `${countries.inFeedCount}/${countries.supportedCount}`,
  );
  await expect(page.getByText("Published within the last 72 hours")).toBeVisible();
  await expect(page.getByText("Everything kept so far")).toBeVisible();
  await expect(page.getByText("Top 15 stories today by market impact")).toBeVisible();
  await page.getByRole("button", { name: "What this number means" }).nth(3).hover();
  await expect(page.getByRole("tooltip", {
    name: "The top 15 stories today, ranked by market impact.",
  })).toBeVisible();
  await expect(page.locator(".homepage-country-chip")).toHaveCount(countries.supportedCount);
  await expect(page.getByRole("heading", { name: "Data overview" })).toBeVisible();
  await expect(page.locator(".homepage-overview-card").filter({ hasText: "Countries covered" })).toContainText("70+");
  await expect(page.locator(".homepage-overview-card").filter({ hasText: "Languages supported" })).toContainText("AR + EN");
});

test("community briefing supports country typeahead and action states", async ({ page }) => {
  await page.goto("/?lang=en");
  const community = page.getByLabel("Kuwait community briefing");
  await community.focus();
  await page.keyboard.press("k");
  await expect(community).toHaveValue("KW");

  const showButton = page.getByRole("button", { name: "Show Kuwait briefing" });
  await showButton.hover();
  await expect(showButton).toHaveCSS("background-color", "rgb(20, 83, 45)");
  await showButton.click();

  await expect(page).toHaveURL(/nationality=KW/);
  await expect(page.getByRole("button", { name: "Refresh Kuwait briefing" })).toBeVisible();
  await expect(page.getByText(/Kuwait selected/)).toBeVisible();
});

test("homepage supports newest sort and date filters", async ({ page }) => {
  await page.goto("/?lang=en");
  await page.getByLabel("Sort").selectOption("date");
  await page.getByLabel("From date").fill("2026-08-17");
  await page.getByLabel("To date").fill("2026-08-17");
  await page.getByRole("button", { name: "Apply filters" }).click();

  await expect(page).toHaveURL(/sort=date/);
  await expect(page).toHaveURL(/from=2026-08-17/);
  await expect(page).toHaveURL(/to=2026-08-17/);
  await expect(page.getByText(/matching articles/)).toBeVisible();
});

test("console login is Arabic-first and switches language", async ({ page }) => {
  await page.goto("/console/login");
  await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible();
  await expect(page.getByLabel("البريد الإلكتروني")).toBeVisible();
  await expect(page.getByLabel("كلمة المرور")).toBeVisible();
  await expect(page.getByRole("button", { name: "تسجيل الدخول", exact: true })).toBeVisible();

  await page.setViewportSize({ width: 320, height: 760 });
  await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible();
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/lang=en/);
  await expect(page.getByRole("heading", { name: "Sign in" }).first()).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("console login, navigation, and responsive layout", async ({ page }) => {
  await signIn(page);

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/console/overview");
    await expect(page.getByRole("heading", { name: "Your Briefly NewsStream platform" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Download platform brief" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Console navigation" })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }

  const pdf = await page.request.get("/api/console/platform-overview");
  expect(pdf.ok()).toBeTruthy();
  expect(pdf.headers()["content-type"]).toContain("pdf");
  expect(Buffer.from(await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
});

test("console schedule page exposes collect and publish controls", async ({ page }) => {
  await signIn(page);
  await page.goto("/consoleofbrieflynewsstreamapi/operations/schedule");
  await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Collect news" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Translate articles" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Publish today's edition" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run now" }).first()).toBeVisible();
  await expect(page.getByLabel("Collect news presets").getByRole("button", { name: "Every 30 minutes" })).toBeVisible();
  await expect(page.getByLabel("Translate articles presets").getByRole("button", { name: "Every 15 minutes" })).toBeVisible();

  const run = await page.request.post("/api/console/schedule/run", {
    data: { key: "translate" },
  });
  expect(run.ok()).toBeTruthy();
  const body = await run.json() as {
    run: { ok: boolean };
    jobs: Array<{ key: string; enabled: boolean }>;
  };
  expect(body.run.ok).toBe(true);
  expect(body.jobs.map((job) => job.key).sort()).toEqual([
    "collect",
    "publish-daily",
    "translate",
  ]);
  expect(body.jobs.every((job) => job.enabled)).toBe(true);
});

test("API key screen exposes secure creation controls", async ({ page }) => {
  await signIn(page);
  await page.goto("/console/keys");
  await expect(page.getByLabel("Key name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create key" })).toBeVisible();

  await page.setViewportSize({ width: 320, height: 760 });
  const targetHeights = await page.locator(".console-shell button, .console-shell a").evaluateAll((elements) => (
    elements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== "none" &&
          style.visibility !== "hidden" &&
          element.getBoundingClientRect().height > 0;
      })
      .map((element) => element.getBoundingClientRect().height)
  ));
  expect(Math.min(...targetHeights)).toBeGreaterThanOrEqual(44);
});

test("console supports system dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await signIn(page);
  await expect(page.locator(".console-shell")).toHaveCSS("color", "rgb(237, 245, 245)");
});

test("API explorer runs filtered requests and exposes JSON", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await page.goto("/console/explorer");

  await page.getByLabel("API key").fill(process.env.API_KEY || "test-market-news-key");
  await page.getByLabel("Search text").fill("gold");
  await page.getByLabel("Category").selectOption("gold");
  await page.getByRole("button", { name: "Run request" }).click();

  await expect(page.getByRole("heading", { name: /matching articles/ })).toBeVisible();
  await expect(page.locator(".explorer-request-bar code")).toContainText("q=gold");
  await expect(page.locator(".explorer-request-bar code")).toContainText("category=gold");
  await expect(page.locator(".explorer-result").first()).toBeVisible();
  await page.getByRole("tab", { name: "JSON" }).click();
  await expect(page.locator(".explorer-json")).toContainText('"items"');

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: /matching articles/ })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }

  await page.setViewportSize({ width: 320, height: 760 });
  await expect(page.getByRole("button", { name: /Filters/ })).toBeVisible();
  const targetHeights = await page.locator(
    ".explorer-workspace button, .explorer-workspace a, .explorer-workspace input, .explorer-workspace select",
  ).evaluateAll((elements) => (
    elements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== "none" &&
          style.visibility !== "hidden" &&
          element.getBoundingClientRect().height > 0;
      })
      .map((element) => element.getBoundingClientRect().height)
  ));
  expect(Math.min(...targetHeights)).toBeGreaterThanOrEqual(44);
});

test("API docs page has section tabs and endpoint examples", async ({ page }) => {
  await signIn(page);
  await page.goto("/console/docs/api");
  await expect(page.getByRole("heading", { name: "Market News API" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Authentication" })).toBeVisible();

  await page.getByRole("tab", { name: "Feeds" }).click();
  await expect(page.getByRole("heading", { name: "Filterable market news" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "curl" })).toBeVisible();
  await page.getByRole("tab", { name: "Response" }).click();
  await expect(page.locator(".api-docs-code")).toContainText('"items"');

  await page.getByRole("tab", { name: "Editions" }).click();
  await expect(page.getByRole("heading", { name: "Today's edition" })).toBeVisible();

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("navigation", { name: "Console navigation" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Editions" })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }

  await page.setViewportSize({ width: 320, height: 760 });
  await expect(page.getByLabel("Endpoint")).toBeVisible();
  const targetHeights = await page.locator(
    ".api-docs button, .api-docs a, .api-docs select",
  ).evaluateAll((elements) => (
    elements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== "none" &&
          style.visibility !== "hidden" &&
          element.getBoundingClientRect().height > 0;
      })
      .map((element) => element.getBoundingClientRect().height)
  ));
  expect(Math.min(...targetHeights)).toBeGreaterThanOrEqual(44);
});

test("console defaults to Arabic and the language switcher flips the dashboard", async ({ page }) => {
  await page.goto("/console/login");
  await page.getByLabel("البريد الإلكتروني").fill(e2eEmail);
  await page.getByLabel("كلمة المرور").fill(e2ePassword);
  await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
  await expect(page).toHaveURL(/\/console\/overview$/, { timeout: 30_000 });
  await expect(page.locator(".console-shell")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("heading", { name: "منصتك في Briefly NewsStream" })).toBeVisible();
  await expect(page.getByRole("link", { name: "نزّل موجز المنصة" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "تنقل اللوحة" })).toBeVisible();
  await expect(page.getByRole("button", { name: "English" })).toBeVisible();

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Your Briefly NewsStream platform" })).toBeVisible();
  await expect(page.locator(".console-shell")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Active session")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Your Briefly NewsStream platform" })).toBeVisible();
});

test("schedule metric words stay intact from 320px through 1440px", async ({ page }) => {
  await signIn(page);
  await page.goto("/consoleofbrieflynewsstreamapi/operations/schedule");

  for (const width of [320, 360, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();

    const metrics = await page.locator(".console-word-metric").evaluateAll((elements) => (
      elements.map((element) => {
        const style = window.getComputedStyle(element);
        return {
          text: (element.textContent || "").replace(/\u200b/g, ""),
          overflowWrap: style.overflowWrap,
          wordBreak: style.wordBreak,
          fontSize: Number.parseFloat(style.fontSize),
          overflowX: element.scrollWidth - element.clientWidth,
        };
      })
    ));

    expect(metrics.map((metric) => metric.text)).toEqual(["Online", "Asia/Kuwait"]);
    for (const metric of metrics) {
      expect(metric.overflowWrap).not.toBe("anywhere");
      expect(metric.wordBreak).not.toBe("break-all");
      expect(metric.fontSize).toBeLessThanOrEqual(28);
      expect(metric.overflowX).toBeLessThanOrEqual(1);
    }

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});
