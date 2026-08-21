/**
 * Codes and URLs reserved by prisma/seed.ts core sources.
 * Keep in sync with the `sources` array there so catalog rows cannot collide.
 */
export const CORE_SOURCE_LOCK = [
  { code: "FED_PRESS", url: "https://www.federalreserve.gov/feeds/press_all.xml" },
  { code: "FED_MONETARY", url: "https://www.federalreserve.gov/feeds/press_monetary.xml" },
  { code: "FED_SPEECHES", url: "https://www.federalreserve.gov/feeds/speeches.xml" },
  { code: "ECB_PRESS", url: "https://www.ecb.europa.eu/rss/press.html" },
  { code: "BBC_BUSINESS", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { code: "MARKETWATCH", url: "https://feeds.marketwatch.com/marketwatch/topstories/" },
  { code: "ARAB_TIMES_BUSINESS", url: "https://www.arabtimesonline.com/rssFeed/30/" },
  { code: "TIMES_KUWAIT", url: "https://timeskuwait.com/feed/" },
  { code: "TIMES_KUWAIT_BUSINESS", url: "https://timeskuwait.com/category/business/feed/" },
  { code: "GULF_NEWS", url: "https://gulfnews.com/feed" },
  { code: "CNBC_MARKETS", url: "https://www.cnbc.com/id/15839069/device/rss/rss.html" },
  { code: "INVESTING_COMMODITIES", url: "https://www.investing.com/rss/news_11.rss" },
  { code: "MINING_GOLD", url: "https://www.mining.com/commodity/gold/feed/" },
  { code: "NORTHERN_MINER", url: "https://www.northernminer.com/feed/" },
  { code: "AL_JAZEERA", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { code: "KITCO", url: "https://www.kitco.com/" },
  { code: "WORLD_GOLD_COUNCIL", url: "https://www.gold.org/goldhub" },
  {
    code: "CBK",
    url: "https://www.cbk.gov.kw/en/cbk-news/announcements-and-press-releases/press-releases/get-list?showAll=1",
  },
  { code: "REUTERS_PUBLIC", url: "https://www.reuters.com/arc/outboundfeeds/sitemap/?outputType=xml" },
  { code: "BLOOMBERG_PUBLIC", url: "https://www.bloomberg.com/sitemaps/news/latest.xml" },
  { code: "KUNA_PUBLIC", url: "https://www.kuna.net.kw/CategoryPage.aspx?id=104&language=en&new=1" },
  { code: "GOOGLE_GROUNDED_NEWS", url: "https://generativelanguage.googleapis.com/v1beta/interactions" },
  {
    code: "GOOGLE_NATIONALITY_NEWS",
    url: "https://generativelanguage.googleapis.com/v1beta/interactions#nationality-news",
  },
] as const;
