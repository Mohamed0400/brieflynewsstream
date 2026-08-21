import { createHash } from "node:crypto";
import { Category, PrismaClient, Region } from "@prisma/client";
import { COUNTRY_SOURCES, generatedCountrySources, RETIRED_COUNTRY_SOURCE_CODES } from "../src/lib/country-sources";
import { storyKey } from "../src/lib/dedupe";
import { kuwaitDate } from "../src/lib/market";
import { audienceValue } from "../src/lib/nationalities";

const prisma = new PrismaClient();

const sources = [
  {
    code: "FED_PRESS",
    name: "Federal Reserve",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    homepageUrl: "https://www.federalreserve.gov/newsevents.htm",
    adapter: "rss",
    country: "US",
    region: Region.AMERICA,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 100,
  },
  {
    code: "FED_MONETARY",
    name: "Federal Reserve Monetary Policy",
    url: "https://www.federalreserve.gov/feeds/press_monetary.xml",
    homepageUrl: "https://www.federalreserve.gov/monetarypolicy.htm",
    adapter: "rss",
    country: "US",
    region: Region.AMERICA,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 100,
  },
  {
    code: "FED_SPEECHES",
    name: "Federal Reserve Speeches",
    url: "https://www.federalreserve.gov/feeds/speeches.xml",
    homepageUrl: "https://www.federalreserve.gov/newsevents/speeches.htm",
    adapter: "rss",
    country: "US",
    region: Region.AMERICA,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 98,
  },
  {
    code: "ECB_PRESS",
    name: "European Central Bank",
    url: "https://www.ecb.europa.eu/rss/press.html",
    homepageUrl: "https://www.ecb.europa.eu/press/html/index.en.html",
    adapter: "rss",
    country: "EU",
    region: Region.GLOBAL,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 100,
  },
  {
    code: "BBC_BUSINESS",
    name: "BBC Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
    homepageUrl: "https://www.bbc.com/business",
    adapter: "rss",
    country: "GB",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 86,
  },
  {
    code: "MARKETWATCH",
    name: "MarketWatch",
    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    homepageUrl: "https://www.marketwatch.com/",
    adapter: "rss",
    country: "US",
    region: Region.AMERICA,
    defaultCategory: Category.FINANCE,
    qualityWeight: 86,
  },
  {
    code: "ARAB_TIMES_BUSINESS",
    name: "Arab Times Business",
    url: "https://www.arabtimesonline.com/rssFeed/30/",
    homepageUrl: "https://www.arabtimesonline.com/news/category/business/",
    adapter: "rss",
    country: "KW",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 82,
  },
  {
    code: "TIMES_KUWAIT",
    name: "The Times Kuwait",
    url: "https://timeskuwait.com/feed/",
    homepageUrl: "https://timeskuwait.com/",
    adapter: "rss",
    country: "KW",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 76,
  },
  {
    code: "TIMES_KUWAIT_BUSINESS",
    name: "The Times Kuwait Business",
    url: "https://timeskuwait.com/category/business/feed/",
    homepageUrl: "https://timeskuwait.com/category/business/",
    adapter: "rss",
    country: "KW",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 84,
  },
  {
    code: "GULF_NEWS",
    name: "Gulf News",
    url: "https://gulfnews.com/feed",
    homepageUrl: "https://gulfnews.com/business",
    adapter: "rss",
    country: "AE",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 80,
  },
  {
    code: "CNBC_MARKETS",
    name: "CNBC Markets",
    url: "https://www.cnbc.com/id/15839069/device/rss/rss.html",
    homepageUrl: "https://www.cnbc.com/markets/",
    adapter: "rss",
    country: "US",
    region: Region.AMERICA,
    defaultCategory: Category.FINANCE,
    qualityWeight: 88,
  },
  {
    code: "INVESTING_COMMODITIES",
    name: "Investing.com Commodities",
    url: "https://www.investing.com/rss/news_11.rss",
    homepageUrl: "https://www.investing.com/commodities/",
    adapter: "rss",
    country: "GLOBAL",
    region: Region.GLOBAL,
    defaultCategory: Category.GOLD,
    qualityWeight: 89,
  },
  {
    code: "MINING_GOLD",
    name: "Mining.com Gold",
    url: "https://www.mining.com/commodity/gold/feed/",
    homepageUrl: "https://www.mining.com/commodity/gold/",
    adapter: "rss",
    country: "GLOBAL",
    region: Region.GLOBAL,
    defaultCategory: Category.GOLD,
    qualityWeight: 90,
  },
  {
    code: "NORTHERN_MINER",
    name: "The Northern Miner",
    url: "https://www.northernminer.com/feed/",
    homepageUrl: "https://www.northernminer.com/",
    adapter: "rss",
    country: "GLOBAL",
    region: Region.GLOBAL,
    defaultCategory: Category.GOLD,
    qualityWeight: 87,
  },
  {
    code: "AL_JAZEERA",
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    homepageUrl: "https://www.aljazeera.com/economy/",
    adapter: "rss",
    country: "GLOBAL",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.MARKETS,
    qualityWeight: 82,
  },
  {
    code: "KITCO",
    name: "Kitco",
    url: "https://www.kitco.com/",
    homepageUrl: "https://www.kitco.com/",
    adapter: "kitco-html",
    country: "GLOBAL",
    region: Region.GLOBAL,
    defaultCategory: Category.GOLD,
    qualityWeight: 91,
  },
  {
    code: "WORLD_GOLD_COUNCIL",
    name: "World Gold Council",
    url: "https://www.gold.org/goldhub",
    homepageUrl: "https://www.gold.org/goldhub",
    adapter: "goldhub-html",
    country: "GLOBAL",
    region: Region.GLOBAL,
    defaultCategory: Category.GOLD,
    qualityWeight: 97,
  },
  {
    code: "CBK",
    name: "Central Bank of Kuwait",
    url: "https://www.cbk.gov.kw/en/cbk-news/announcements-and-press-releases/press-releases/get-list?showAll=1",
    homepageUrl: "https://www.cbk.gov.kw/en/cbk-news/announcements-and-press-releases/press-releases",
    adapter: "cbk-html",
    country: "KW",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 100,
  },
  {
    code: "REUTERS_PUBLIC",
    name: "Reuters",
    url: "https://www.reuters.com/arc/outboundfeeds/sitemap/?outputType=xml",
    homepageUrl: "https://www.reuters.com/markets/",
    adapter: "reuters-sitemap",
    country: "GLOBAL",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 97,
  },
  {
    code: "BLOOMBERG_PUBLIC",
    name: "Bloomberg",
    url: "https://www.bloomberg.com/sitemaps/news/latest.xml",
    homepageUrl: "https://www.bloomberg.com/markets",
    adapter: "bloomberg-sitemap",
    country: "GLOBAL",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 95,
  },
  {
    code: "KUNA_PUBLIC",
    name: "Kuwait News Agency (KUNA)",
    url: "https://www.kuna.net.kw/CategoryPage.aspx?id=104&language=en&new=1",
    homepageUrl: "https://www.kuna.net.kw/Default.aspx?language=en",
    adapter: "kuna-html",
    country: "KW",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 92,
  },
  {
    code: "GOOGLE_GROUNDED_NEWS",
    name: "Google Search Grounding",
    url: "https://generativelanguage.googleapis.com/v1beta/interactions",
    homepageUrl: "https://ai.google.dev/gemini-api/docs/google-search",
    adapter: "gemini-search",
    country: "GLOBAL",
    region: Region.GLOBAL,
    defaultCategory: Category.MARKETS,
    qualityWeight: 90,
  },
  {
    code: "GOOGLE_NATIONALITY_NEWS",
    name: "Google Nationality News",
    url: "https://generativelanguage.googleapis.com/v1beta/interactions#nationality-news",
    homepageUrl: "https://ai.google.dev/gemini-api/docs/google-search",
    adapter: "gemini-nationality-search",
    country: "GLOBAL",
    region: Region.GLOBAL,
    defaultCategory: Category.MARKETS,
    qualityWeight: 90,
  },
] as const;

const allSources = [...sources, ...COUNTRY_SOURCES, ...generatedCountrySources()];
export { sources as CORE_SEED_SOURCES, allSources };

function shouldSeedBilingualFixtures() {
  const databaseUrl = process.env.DATABASE_URL || "";
  return process.env.NEXT_PUBLIC_APP_ENV === "test"
    && /(?:test|ci)\.db/i.test(databaseUrl);
}

async function seedBilingualFixtures() {
  if (!shouldSeedBilingualFixtures()) return;

  const source = await prisma.source.findUnique({ where: { code: "BBC_BUSINESS" } });
  if (!source) return;

  const publishedAt = new Date();
  const fixtures = [
    {
      url: "https://example.test/e2e/markets-bilingual",
      title: "E2EBILINGUAL Central banks hold rates as oil stays in focus",
      summary: "Desks watch policy signals before the next move in energy and rates.",
      titleAr: "فحص ثنائي اللغة البنوك المركزية تثبّت الفائدة مع استمرار التركيز على النفط",
      summaryAr: "تابع المتعاملون إشارات السياسة قبل الخطوة التالية في الطاقة والفائدة.",
      category: Category.MARKETS,
      country: "US",
      region: Region.GLOBAL,
      section: "markets",
      scores: {
        relevance: 90,
        freshness: 95,
        sourceQuality: 86,
        goldImpact: 20,
        usdImpact: 70,
        ratesImpact: 88,
        oilImpact: 82,
        middleEastImpact: 40,
        marketImpact: 85,
        finalScore: 100,
        explanation: "E2E bilingual markets fixture.",
      },
    },
    {
      url: "https://example.test/e2e/fed-markets-bilingual",
      title: "E2EBILINGUAL Federal Reserve signals patience on rates",
      summary: "Officials said they will wait for more inflation data before changing policy.",
      titleAr: "الاحتياطي الفيدرالي يشير إلى التريث بشأن أسعار الفائدة",
      summaryAr: "قال المسؤولون إنهم سينتظرون مزيداً من بيانات التضخم قبل تغيير السياسة.",
      category: Category.ECONOMICS,
      country: "US",
      region: Region.AMERICA,
      section: "economics",
      scores: {
        relevance: 88,
        freshness: 94,
        sourceQuality: 100,
        goldImpact: 40,
        usdImpact: 82,
        ratesImpact: 90,
        oilImpact: 15,
        middleEastImpact: 30,
        marketImpact: 80,
        finalScore: 97,
        explanation: "E2E bilingual rates fixture.",
      },
    },
  ] as const;

  const articleIds: string[] = [];
  for (const fixture of fixtures) {
    const hash = createHash("sha256").update(fixture.url).digest("hex");
    const article = await prisma.article.upsert({
      where: { url: fixture.url },
      create: {
        sourceId: source.id,
        title: fixture.title,
        summary: fixture.summary,
        titleEn: fixture.title,
        summaryEn: fixture.summary,
        titleAr: fixture.titleAr,
        summaryAr: fixture.summaryAr,
        translatedAt: publishedAt,
        publisher: "E2E Fixture",
        audienceCodes: audienceValue([fixture.country]),
        url: fixture.url,
        category: fixture.category,
        country: fixture.country,
        region: fixture.region,
        language: "en",
        publishedAt,
        contentHash: hash,
        storyKey: storyKey(fixture.title),
        finalScore: fixture.scores.finalScore,
        score: { create: fixture.scores },
      },
      update: {
        title: fixture.title,
        summary: fixture.summary,
        titleEn: fixture.title,
        summaryEn: fixture.summary,
        titleAr: fixture.titleAr,
        summaryAr: fixture.summaryAr,
        translatedAt: publishedAt,
        publishedAt,
        language: "en",
        finalScore: fixture.scores.finalScore,
      },
    });
    articleIds.push(article.id);
  }

  const date = kuwaitDate(publishedAt);
  const edition = await prisma.dailyEdition.upsert({
    where: { date },
    create: {
      date,
      status: "PUBLISHED",
      locked: false,
      itemCount: 0,
      summary: "E2E bilingual fixtures for ar/en storage checks.",
    },
    update: {
      status: "PUBLISHED",
      summary: "E2E bilingual fixtures for ar/en storage checks.",
    },
  });

  for (const [index, articleId] of articleIds.entries()) {
    let rank = index + 1;
    while (await prisma.dailyEditionItem.findFirst({
      where: { editionId: edition.id, rank, articleId: { not: articleId } },
      select: { id: true },
    })) {
      rank += 1;
    }
    await prisma.dailyEditionItem.upsert({
      where: { editionId_articleId: { editionId: edition.id, articleId } },
      create: {
        editionId: edition.id,
        articleId,
        rank,
        section: fixtures[index].section,
      },
      update: { rank, section: fixtures[index].section },
    });
  }

  const itemCount = await prisma.dailyEditionItem.count({ where: { editionId: edition.id } });
  await prisma.dailyEdition.update({
    where: { id: edition.id },
    data: { itemCount },
  });
  console.log(`Seeded ${fixtures.length} bilingual test articles for ${date}.`);
}

async function main() {
  for (const source of allSources) {
    await prisma.source.upsert({
      where: { code: source.code },
      update: source,
      create: source,
    });
  }
  for (const code of RETIRED_COUNTRY_SOURCE_CODES) {
    await prisma.source.updateMany({
      where: { code },
      data: { enabled: false },
    });
  }
  await seedBilingualFixtures();
  console.log(`Seeded ${allSources.length} sources (${sources.length} core + ${COUNTRY_SOURCES.length} country-local).`);
}

const ranDirectly = process.argv[1]?.replaceAll("\\", "/").endsWith("prisma/seed.ts");
if (ranDirectly) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
