import { Category } from "@prisma/client";
import { type CountrySourceSeed, type PublisherRow, rowsToSources } from "./types";

/**
 * Investing.com webmaster RSS (section IDs from their public RSS tools).
 * `news_11.rss` (commodities) is owned by seed core INVESTING_COMMODITIES.
 * Regional hosts reuse the documented `/rss/news.rss` path.
 */
const INVESTING_ROWS = [
  ["INVESTING_NEWS", "Investing.com News", "https://www.investing.com/rss/news.rss", "https://www.investing.com/news/", "GLOBAL", Category.MARKETS, 90],
  ["INVESTING_STOCKS", "Investing.com Stocks", "https://www.investing.com/rss/news_1.rss", "https://www.investing.com/equities/", "GLOBAL", Category.FINANCE, 90],
  ["INVESTING_ECONOMY", "Investing.com Economy", "https://www.investing.com/rss/news_14.rss", "https://www.investing.com/news/economy/", "GLOBAL", Category.ECONOMICS, 93],
  ["INVESTING_FOREX", "Investing.com Forex", "https://www.investing.com/rss/news_25.rss", "https://www.investing.com/currencies/", "GLOBAL", Category.FINANCE, 90],
  ["INVESTING_CRYPTO", "Investing.com Crypto", "https://www.investing.com/rss/news_95.rss", "https://www.investing.com/crypto/", "GLOBAL", Category.FINANCE, 85],
  ["INVESTING_WORLD", "Investing.com World", "https://www.investing.com/rss/news_285.rss", "https://www.investing.com/news/world-news/", "GLOBAL", Category.MARKETS, 88],
  ["INVESTING_BREAKING", "Investing.com Breaking", "https://www.investing.com/rss/news_301.rss", "https://www.investing.com/news/", "GLOBAL", Category.MARKETS, 92],
  ["INVESTING_POPULAR", "Investing.com Popular", "https://www.investing.com/rss/news_356.rss", "https://www.investing.com/news/", "GLOBAL", Category.MARKETS, 88],
  ["INVESTING_COMPANY", "Investing.com Company News", "https://www.investing.com/rss/news_477.rss", "https://www.investing.com/news/stock-market-news/", "GLOBAL", Category.FINANCE, 88],
  ["INVESTING_UK", "Investing.com UK", "https://uk.investing.com/rss/news.rss", "https://uk.investing.com/", "GB", Category.FINANCE, 86],
  ["INVESTING_DE", "Investing.com Germany", "https://de.investing.com/rss/news.rss", "https://de.investing.com/", "DE", Category.FINANCE, 86],
  ["INVESTING_FR", "Investing.com France", "https://fr.investing.com/rss/news.rss", "https://fr.investing.com/", "FR", Category.FINANCE, 86],
  ["INVESTING_IT", "Investing.com Italy", "https://it.investing.com/rss/news.rss", "https://it.investing.com/", "IT", Category.FINANCE, 86],
  ["INVESTING_ES", "Investing.com Spain", "https://es.investing.com/rss/news.rss", "https://es.investing.com/", "ES", Category.FINANCE, 86],
  ["INVESTING_NL", "Investing.com Netherlands", "https://nl.investing.com/rss/news.rss", "https://nl.investing.com/", "NL", Category.FINANCE, 86],
  ["INVESTING_PL", "Investing.com Poland", "https://pl.investing.com/rss/news.rss", "https://pl.investing.com/", "PL", Category.FINANCE, 86],
  ["INVESTING_RU", "Investing.com Russia", "https://ru.investing.com/rss/news.rss", "https://ru.investing.com/", "RU", Category.FINANCE, 84],
  ["INVESTING_BR", "Investing.com Brazil", "https://br.investing.com/rss/news.rss", "https://br.investing.com/", "BR", Category.FINANCE, 86],
  ["INVESTING_MX", "Investing.com Mexico", "https://mx.investing.com/rss/news.rss", "https://mx.investing.com/", "MX", Category.FINANCE, 86],
  ["INVESTING_CA", "Investing.com Canada", "https://ca.investing.com/rss/news.rss", "https://ca.investing.com/", "CA", Category.FINANCE, 86],
  ["INVESTING_IN", "Investing.com India", "https://in.investing.com/rss/news.rss", "https://in.investing.com/", "IN", Category.FINANCE, 86],
  ["INVESTING_AU", "Investing.com Australia", "https://au.investing.com/rss/news.rss", "https://au.investing.com/", "AU", Category.FINANCE, 86],
  ["INVESTING_JP", "Investing.com Japan", "https://jp.investing.com/rss/news.rss", "https://jp.investing.com/", "JP", Category.FINANCE, 86],
  ["INVESTING_KR", "Investing.com Korea", "https://kr.investing.com/rss/news.rss", "https://kr.investing.com/", "KR", Category.FINANCE, 86],
  ["INVESTING_CN", "Investing.com China", "https://cn.investing.com/rss/news.rss", "https://cn.investing.com/", "CN", Category.FINANCE, 86],
  ["INVESTING_HK", "Investing.com Hong Kong", "https://hk.investing.com/rss/news.rss", "https://hk.investing.com/", "HK", Category.FINANCE, 86],
  ["INVESTING_SA", "Investing.com Saudi Arabia", "https://sa.investing.com/rss/news.rss", "https://sa.investing.com/", "SA", Category.ME_ECONOMY, 86],
  ["INVESTING_AE", "Investing.com UAE", "https://ae.investing.com/rss/news.rss", "https://ae.investing.com/", "AE", Category.ME_ECONOMY, 86],
  ["INVESTING_TR", "Investing.com Turkiye", "https://tr.investing.com/rss/news.rss", "https://tr.investing.com/", "TR", Category.FINANCE, 86],
  ["INVESTING_ID", "Investing.com Indonesia", "https://id.investing.com/rss/news.rss", "https://id.investing.com/", "ID", Category.FINANCE, 86],
  ["INVESTING_TH", "Investing.com Thailand", "https://th.investing.com/rss/news.rss", "https://th.investing.com/", "TH", Category.FINANCE, 86],
  ["INVESTING_VN", "Investing.com Vietnam", "https://vn.investing.com/rss/news.rss", "https://vn.investing.com/", "VN", Category.FINANCE, 86],
  ["INVESTING_ZA", "Investing.com South Africa", "https://za.investing.com/rss/news.rss", "https://za.investing.com/", "ZA", Category.FINANCE, 86],
  ["INVESTING_MY", "Investing.com Malaysia", "https://my.investing.com/rss/news.rss", "https://my.investing.com/", "MY", Category.FINANCE, 86],
  ["INVESTING_PH", "Investing.com Philippines", "https://ph.investing.com/rss/news.rss", "https://ph.investing.com/", "PH", Category.FINANCE, 86],
] as const;

const REGIONAL_INVESTING_HOSTS = [
  ["KW", "Kuwait", "kw"],
  ["QA", "Qatar", "qa"],
  ["BH", "Bahrain", "bh"],
  ["OM", "Oman", "om"],
  ["EG", "Egypt", "eg"],
  ["JO", "Jordan", "jo"],
  ["IQ", "Iraq", "iq"],
  ["LB", "Lebanon", "lb"],
  ["MA", "Morocco", "ma"],
  ["TN", "Tunisia", "tn"],
  ["DZ", "Algeria", "dz"],
  ["LY", "Libya", "ly"],
  ["IL", "Israel", "il"],
  ["PK", "Pakistan", "pk"],
  ["BD", "Bangladesh", "bd"],
  ["LK", "Sri Lanka", "lk"],
  ["NP", "Nepal", "np"],
  ["SG", "Singapore", "sg"],
  ["NZ", "New Zealand", "nz"],
  ["GH", "Ghana", "gh"],
  ["KE", "Kenya", "ke"],
  ["NG", "Nigeria", "ng"],
  ["PT", "Portugal", "pt"],
  ["IE", "Ireland", "ie"],
  ["KZ", "Kazakhstan", "kz"],
  ["AR", "Argentina", "ar"],
  ["CL", "Chile", "cl"],
  ["BE", "Belgium", "be"],
  ["AT", "Austria", "at"],
  ["SE", "Sweden", "se"],
  ["NO", "Norway", "no"],
  ["DK", "Denmark", "dk"],
  ["UA", "Ukraine", "ua"],
  ["TW", "Taiwan", "tw"],
] as const;

const REGIONAL_INVESTING_TOPICS = [
  ["NEWS", "News", "news.rss", Category.MARKETS, 84],
  ["STOCKS", "Stocks", "news_1.rss", Category.FINANCE, 84],
  ["ECONOMY", "Economy", "news_14.rss", Category.ECONOMICS, 86],
  ["FOREX", "Forex", "news_25.rss", Category.FINANCE, 84],
] as const;

/** Kuwait desk gets higher weight than other regional Investing hosts. */
const KW_INVESTING_WEIGHT_BOOST = 8;

const EXISTING_REGIONAL_NEWS = new Set<string>(INVESTING_ROWS.map(([code]) => code));

const REGIONAL_INVESTING_ROWS: PublisherRow[] = REGIONAL_INVESTING_HOSTS.flatMap(
  ([country, label, host]) =>
    REGIONAL_INVESTING_TOPICS.flatMap(([topic, topicLabel, rssFile, category, weight]) => {
      const code = topic === "NEWS" ? `INVESTING_${country}` : `INVESTING_${country}_${topic}`;
      if (EXISTING_REGIONAL_NEWS.has(code)) return [];
      const boosted = country === "KW" ? Math.min(98, weight + KW_INVESTING_WEIGHT_BOOST) : weight;
      return [[
        code,
        `Investing.com ${label} ${topicLabel}`,
        `https://${host}.investing.com/rss/${rssFile}`,
        `https://${host}.investing.com/`,
        country,
        category,
        boosted,
      ]];
    }),
);

export const INVESTING_SOURCES: CountrySourceSeed[] = rowsToSources([
  ...INVESTING_ROWS,
  ...REGIONAL_INVESTING_ROWS,
]);
