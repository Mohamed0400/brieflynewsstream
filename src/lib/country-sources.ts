import { Category, Region } from "@prisma/client";
import { COUNTRY_CATALOG } from "./countries";
import { regionForCountry } from "./classify";
import { CORE_SOURCE_LOCK } from "./sources/core-lock";
import { COUNTRY_PUBLISHERS } from "./sources/country-publishers";
import { GLOBAL_PUBLISHERS } from "./sources/global-publishers";
import { INVESTING_SOURCES } from "./sources/investing-sources";
import { MENA_PUBLISHERS } from "./sources/mena-publishers";
import { countryRss, type CountrySourceSeed } from "./sources/types";

export type { CountrySourceSeed } from "./sources/types";
export { countryRss } from "./sources/types";

/** Sources retired after feed URLs broke; kept so seed can disable stale rows. */
export const RETIRED_COUNTRY_SOURCE_CODES = [
  "KUNA_ECON",
  "SPA_SA",
  "WAM_AE_BUSINESS",
  "MANILA_TIMES_PH",
  "DAILY_MIRROR_LK",
  "AMMON_JO",
  "BUSINESS_NEWS_LB",
  "RUDAW_IQ",
  "GUARDIAN_NG",
  "ADDIS_FORTUNE_ET",
  "ARAB_NEWS_SA_ECON",
  "ARAB_NEWS_SA_SECTION",
  "ALMASDAR_YE",
  "HOY_PY",
  "BUSINESS_NEWS_TN",
  "TAP_TN",
] as const;

/** Supplemental country coverage where a local publisher feed is unavailable. */
const EXPANDED_COUNTRY_SOURCES: CountrySourceSeed[] = [
  countryRss("DOHA_NEWS_QA", "Doha News", "https://dohanews.co/feed/", "https://dohanews.co/", "QA", Region.MIDDLE_EAST, Category.ME_ECONOMY, 80),
  countryRss("GNEWS_QA", "Qatar Economy", "https://news.google.com/rss/search?q=Qatar+(economy+OR+markets+OR+finance)&hl=en-US&gl=US&ceid=US:en", "https://news.google.com/", "QA", Region.MIDDLE_EAST, Category.ME_ECONOMY, 70),
  countryRss("GNEWS_BH", "Bahrain Economy", "https://news.google.com/rss/search?q=Bahrain+(economy+OR+markets+OR+finance+OR+%22central+bank%22)&hl=en-US&gl=US&ceid=US:en", "https://news.google.com/", "BH", Region.MIDDLE_EAST, Category.ME_ECONOMY, 70),
  countryRss("TIMES_OMAN_OM", "Times of Oman", "https://timesofoman.com/feed", "https://timesofoman.com/", "OM", Region.MIDDLE_EAST, Category.ME_ECONOMY, 80),
  countryRss("LIBYA_HERALD_LY", "Libya Herald", "https://www.libyaherald.com/feed/", "https://www.libyaherald.com/", "LY", Region.MIDDLE_EAST, Category.ME_ECONOMY, 74),
  countryRss("GNEWS_IL", "Israel Economy", "https://news.google.com/rss/search?q=Israel+(economy+OR+markets+OR+finance+OR+%22Bank+of+Israel%22)&hl=en-US&gl=US&ceid=US:en", "https://news.google.com/", "IL", Region.MIDDLE_EAST, Category.FINANCE, 70),
  countryRss("FINANCIAL_POST_CA", "Financial Post", "https://financialpost.com/feed", "https://financialpost.com/", "CA", Region.AMERICA, Category.FINANCE, 86),
  countryRss("JORNADA_MX", "La Jornada Economia", "https://www.jornada.com.mx/rss/economia.xml", "https://www.jornada.com.mx/", "MX", Region.AMERICA, Category.ECONOMICS, 78),
  countryRss("FOLHA_BR", "Folha Mercado", "https://feeds.folha.uol.com.br/mercado/rss091.xml", "https://www.folha.uol.com.br/mercado/", "BR", Region.AMERICA, Category.FINANCE, 84),
  countryRss("BA_TIMES_AR", "Buenos Aires Times", "https://www.batimes.com.ar/feed", "https://www.batimes.com.ar/", "AR", Region.AMERICA, Category.ECONOMICS, 80),
  countryRss("GNEWS_CL", "Chile Economy", "https://news.google.com/rss/search?q=Chile+(economy+OR+markets+OR+copper+OR+%22central+bank%22)&hl=en-US&gl=US&ceid=US:en", "https://news.google.com/", "CL", Region.AMERICA, Category.ECONOMICS, 70),
  countryRss("DW_DE_BUSINESS", "Deutsche Welle Business", "https://rss.dw.com/rdf/rss-en-bus", "https://www.dw.com/en/business/s-1431", "DE", Region.GLOBAL, Category.ECONOMICS, 88),
  countryRss("SPIEGEL_DE_BUSINESS", "Spiegel International Business", "https://www.spiegel.de/international/business/index.rss", "https://www.spiegel.de/international/business/", "DE", Region.GLOBAL, Category.FINANCE, 84),
  countryRss("LEMONDE_FR", "Le Monde Economie", "https://www.lemonde.fr/economie/rss_full.xml", "https://www.lemonde.fr/economie/", "FR", Region.GLOBAL, Category.ECONOMICS, 88),
  countryRss("ANSA_IT", "ANSA Economia", "https://www.ansa.it/sito/notizie/economia/economia_rss.xml", "https://www.ansa.it/sito/notizie/economia/", "IT", Region.GLOBAL, Category.ECONOMICS, 84),
  countryRss("REPUBBLICA_IT", "La Repubblica Economia", "https://www.repubblica.it/rss/economia/rss2.0.xml", "https://www.repubblica.it/economia/", "IT", Region.GLOBAL, Category.FINANCE, 82),
  countryRss("ELPAIS_ES", "El Pais Economia", "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada", "https://elpais.com/economia/", "ES", Region.GLOBAL, Category.ECONOMICS, 86),
  countryRss("EXPANSION_ES", "Expansion", "https://e00-expansion.uecdn.es/rss/portada.xml", "https://www.expansion.com/", "ES", Region.GLOBAL, Category.FINANCE, 82),
  countryRss("NLTIMES_NL", "NL Times", "https://nltimes.nl/rss.xml", "https://nltimes.nl/", "NL", Region.GLOBAL, Category.MARKETS, 76),
  countryRss("DUTCHNEWS_NL", "Dutch News", "https://www.dutchnews.nl/feed/", "https://www.dutchnews.nl/", "NL", Region.GLOBAL, Category.MARKETS, 76),
  countryRss("GNEWS_CH", "Switzerland Economy", "https://news.google.com/rss/search?q=Switzerland+(economy+OR+markets+OR+SNB+OR+franc)&hl=en-US&gl=US&ceid=US:en", "https://news.google.com/", "CH", Region.GLOBAL, Category.FINANCE, 70),
  countryRss("VRT_BE", "VRT NWS English", "https://www.vrt.be/vrtnws/en.rss.articles.xml", "https://www.vrt.be/vrtnws/en/", "BE", Region.GLOBAL, Category.MARKETS, 80),
  countryRss("ORF_AT", "ORF News", "https://rss.orf.at/news.xml", "https://orf.at/", "AT", Region.GLOBAL, Category.MARKETS, 80),
  countryRss("THELOCAL_SE", "The Local Sweden", "https://feeds.thelocal.com/rss/se", "https://www.thelocal.se/", "SE", Region.GLOBAL, Category.MARKETS, 76),
  countryRss("NEWS_IN_ENGLISH_NO", "News in English Norway", "https://www.newsinenglish.no/feed/", "https://www.newsinenglish.no/", "NO", Region.GLOBAL, Category.OIL, 78),
  countryRss("CPHPOST_DK", "Copenhagen Post", "https://cphpost.dk/feed/", "https://cphpost.dk/", "DK", Region.GLOBAL, Category.MARKETS, 74),
  countryRss("NOTES_PL", "Notes from Poland", "https://notesfrompoland.com/feed/", "https://notesfrompoland.com/", "PL", Region.GLOBAL, Category.ECONOMICS, 78),
  countryRss("UKRINFORM_UA", "Ukrinform", "https://www.ukrinform.net/rss/block-lastnews", "https://www.ukrinform.net/", "UA", Region.GLOBAL, Category.MARKETS, 80),
  countryRss("TASS_RU", "TASS", "https://tass.com/rss/v2.xml", "https://tass.com/", "RU", Region.GLOBAL, Category.MARKETS, 78),
  countryRss("MOSCOW_TIMES_RU", "The Moscow Times", "https://www.themoscowtimes.com/rss/news", "https://www.themoscowtimes.com/", "RU", Region.GLOBAL, Category.MARKETS, 76),
  countryRss("JAPAN_TIMES_JP", "The Japan Times", "https://www.japantimes.co.jp/feed/", "https://www.japantimes.co.jp/", "JP", Region.GLOBAL, Category.FINANCE, 84),
  countryRss("KOREA_TIMES_KR", "Korea Times Business", "https://www.koreatimes.co.kr/www/rss/biz.xml", "https://www.koreatimes.co.kr/", "KR", Region.GLOBAL, Category.FINANCE, 80),
  countryRss("SCMP_HK", "South China Morning Post Business", "https://www.scmp.com/rss/92/feed", "https://www.scmp.com/business", "HK", Region.GLOBAL, Category.FINANCE, 86),
  countryRss("TAIPEI_TIMES_TW", "Taipei Times", "https://www.taipeitimes.com/xml/index.rss", "https://www.taipeitimes.com/", "TW", Region.GLOBAL, Category.MARKETS, 78),
  countryRss("MALAYMAIL_MY", "Malay Mail Money", "https://www.malaymail.com/feed/rss/money", "https://www.malaymail.com/money", "MY", Region.GLOBAL, Category.FINANCE, 80),
  countryRss("STRAITS_TIMES_SG", "The Straits Times Business", "https://www.straitstimes.com/news/business/rss.xml", "https://www.straitstimes.com/business", "SG", Region.GLOBAL, Category.FINANCE, 86),
  countryRss("BANGKOK_POST_TH", "Bangkok Post Business", "https://www.bangkokpost.com/rss/data/business.xml", "https://www.bangkokpost.com/business", "TH", Region.GLOBAL, Category.FINANCE, 82),
  countryRss("VNEXPRESS_VN", "VNExpress Business", "https://e.vnexpress.net/rss/business.rss", "https://e.vnexpress.net/business", "VN", Region.GLOBAL, Category.ECONOMICS, 80),
  countryRss("ABC_AU_BUSINESS", "ABC News Australia Business", "https://www.abc.net.au/news/feed/45910/rss.xml", "https://www.abc.net.au/news/business/", "AU", Region.GLOBAL, Category.ECONOMICS, 86),
  countryRss("RNZ_NZ", "RNZ Business", "https://www.rnz.co.nz/rss/business.xml", "https://www.rnz.co.nz/news/business", "NZ", Region.GLOBAL, Category.ECONOMICS, 84),
  countryRss("GNEWS_ZA", "South Africa Economy", "https://news.google.com/rss/search?q=South+Africa+(economy+OR+markets+OR+rand+OR+SARB)&hl=en-US&gl=US&ceid=US:en", "https://news.google.com/", "ZA", Region.GLOBAL, Category.ECONOMICS, 70),
  countryRss("JOYONLINE_GH", "Joy Online", "https://www.myjoyonline.com/feed/", "https://www.myjoyonline.com/", "GH", Region.GLOBAL, Category.MARKETS, 76),
  countryRss("PORTUGAL_RESIDENT_PT", "Portugal Resident", "https://www.portugalresident.com/feed/", "https://www.portugalresident.com/", "PT", Region.GLOBAL, Category.MARKETS, 74),
  countryRss("INDEPENDENT_IE", "Irish Independent Business", "https://www.independent.ie/business/rss", "https://www.independent.ie/business/", "IE", Region.GLOBAL, Category.FINANCE, 82),
  countryRss("ASTANA_TIMES_KZ", "The Astana Times", "https://www.astanatimes.com/feed/", "https://www.astanatimes.com/", "KZ", Region.GLOBAL, Category.ECONOMICS, 76),
  countryRss("GNEWS_YE", "Yemen Economy", "https://news.google.com/rss/search?q=Yemen+(economy+OR+markets+OR+finance+OR+aden+OR+sanaa)&hl=en-US&gl=US&ceid=US:en", "https://news.google.com/", "YE", Region.MIDDLE_EAST, Category.ME_ECONOMY, 70),
];

/**
 * Verified RSS sources keyed to article.country for nationality/country filters.
 * Each country should have enough daily output for 5–6 fresh items after classification.
 * URLs return XML/RSS (not HTML landing pages) as of Aug 2026.
 */
export const COUNTRY_SOURCES: CountrySourceSeed[] = [
  {
    code: "ARAB_NEWS_SA",
    name: "Arab News",
    url: "https://www.arabnews.com/rss.xml",
    homepageUrl: "https://www.arabnews.com/",
    adapter: "rss",
    country: "SA",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 86,
  },
  {
    code: "SAUDI_GAZETTE_SA",
    name: "Saudi Gazette Business",
    url: "https://saudigazette.com.sa/rss/business",
    homepageUrl: "https://saudigazette.com.sa/",
    adapter: "rss",
    country: "SA",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 82,
  },
  {
    code: "AL_ARABIYA_AE",
    name: "Al Arabiya Business",
    url: "https://english.alarabiya.net/rss/business",
    homepageUrl: "https://english.alarabiya.net/business",
    adapter: "rss",
    country: "AE",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 84,
  },
  {
    code: "DAILY_NEWS_EG",
    name: "Daily News Egypt",
    url: "https://www.dailynewsegypt.com/feed",
    homepageUrl: "https://www.dailynewsegypt.com/",
    adapter: "rss",
    country: "EG",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 82,
  },
  {
    code: "ET_IN_ECONOMY",
    name: "Economic Times Economy",
    url: "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms",
    homepageUrl: "https://economictimes.indiatimes.com/news/economy",
    adapter: "rss",
    country: "IN",
    region: Region.GLOBAL,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 88,
  },
  {
    code: "LIVEMINT_IN_MARKETS",
    name: "Livemint Markets",
    url: "https://www.livemint.com/rss/markets",
    homepageUrl: "https://www.livemint.com/market",
    adapter: "rss",
    country: "IN",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 86,
  },
  {
    code: "HINDU_IN_BUSINESS",
    name: "The Hindu Business",
    url: "https://www.thehindu.com/business/feeder/default.rss",
    homepageUrl: "https://www.thehindu.com/business/",
    adapter: "rss",
    country: "IN",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 84,
  },
  {
    code: "BS_IN_MARKETS",
    name: "Business Standard Markets",
    url: "https://feeds.feedburner.com/business-standard/markets",
    homepageUrl: "https://www.business-standard.com/markets",
    adapter: "rss",
    country: "IN",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 85,
  },
  {
    code: "DAWN_PK",
    name: "Dawn",
    url: "https://www.dawn.com/feeds/home",
    homepageUrl: "https://www.dawn.com/",
    adapter: "rss",
    country: "PK",
    region: Region.GLOBAL,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 84,
  },
  {
    code: "BRECORDER_PK",
    name: "Business Recorder",
    url: "https://www.brecorder.com/feeds/latest-news",
    homepageUrl: "https://www.brecorder.com/",
    adapter: "rss",
    country: "PK",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 86,
  },
  {
    code: "DAILY_STAR_BD",
    name: "The Daily Star Business",
    url: "https://www.thedailystar.net/business/rss.xml",
    homepageUrl: "https://www.thedailystar.net/business",
    adapter: "rss",
    country: "BD",
    region: Region.GLOBAL,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 82,
  },
  {
    code: "TBS_BD_ECON",
    name: "The Business Standard Economy",
    url: "https://www.tbsnews.net/economy/rss.xml",
    homepageUrl: "https://www.tbsnews.net/economy",
    adapter: "rss",
    country: "BD",
    region: Region.GLOBAL,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 84,
  },
  {
    code: "PROTHOM_ALO_BD",
    name: "Prothom Alo",
    url: "https://www.prothomalo.com/feed/",
    homepageUrl: "https://www.prothomalo.com/",
    adapter: "rss",
    country: "BD",
    region: Region.GLOBAL,
    defaultCategory: Category.MARKETS,
    qualityWeight: 80,
  },
  {
    code: "INQUIRER_PH",
    name: "Inquirer.net",
    url: "https://www.inquirer.net/fullfeed",
    homepageUrl: "https://www.inquirer.net/",
    adapter: "rss",
    country: "PH",
    region: Region.GLOBAL,
    defaultCategory: Category.MARKETS,
    qualityWeight: 78,
  },
  {
    code: "BWORLD_PH",
    name: "BusinessWorld Philippines",
    url: "https://www.bworldonline.com/feed/",
    homepageUrl: "https://www.bworldonline.com/",
    adapter: "rss",
    country: "PH",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 82,
  },
  {
    code: "LBO_LK",
    name: "Lanka Business Online",
    url: "https://www.lankabusinessonline.com/feed/",
    homepageUrl: "https://www.lankabusinessonline.com/",
    adapter: "rss",
    country: "LK",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 82,
  },
  {
    code: "FT_LK",
    name: "Daily FT Business",
    url: "https://www.ft.lk/rss/business/1",
    homepageUrl: "https://www.ft.lk/business",
    adapter: "rss",
    country: "LK",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 80,
  },
  {
    code: "KATHMANDU_POST_NP",
    name: "Kathmandu Post Business",
    url: "https://kathmandupost.com/rss/?category=business",
    homepageUrl: "https://kathmandupost.com/business",
    adapter: "rss",
    country: "NP",
    region: Region.GLOBAL,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 80,
  },
  {
    code: "ROYA_JO",
    name: "Roya News",
    url: "https://www.roya.tv/rss",
    homepageUrl: "https://en.roya.tv/",
    adapter: "rss",
    country: "JO",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 76,
  },
  {
    code: "AL_MONITOR_LB",
    name: "Al-Monitor",
    url: "https://www.al-monitor.com/rss",
    homepageUrl: "https://www.al-monitor.com/",
    adapter: "rss",
    country: "LB",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 80,
  },
  {
    code: "IRAQ_BUSINESS_NEWS",
    name: "Iraq Business News",
    url: "https://www.iraq-businessnews.com/feed/",
    homepageUrl: "https://www.iraq-businessnews.com/",
    adapter: "rss",
    country: "IQ",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.OIL,
    qualityWeight: 82,
  },
  {
    code: "TEHRAN_TIMES_IR",
    name: "Tehran Times",
    url: "https://www.tehrantimes.com/rss",
    homepageUrl: "https://www.tehrantimes.com/",
    adapter: "rss",
    country: "IR",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 74,
  },
  {
    code: "HURRIYET_TR",
    name: "Hürriyet Daily News Business",
    url: "https://www.hurriyetdailynews.com/rss/business",
    homepageUrl: "https://www.hurriyetdailynews.com/business",
    adapter: "rss",
    country: "TR",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.FINANCE,
    qualityWeight: 82,
  },
  {
    code: "ANADOLU_TR_ECON",
    name: "Anadolu Agency Economy",
    url: "https://www.aa.com.tr/en/rss/default?cat=economy",
    homepageUrl: "https://www.aa.com.tr/en/economy",
    adapter: "rss",
    country: "TR",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 86,
  },
  {
    code: "SANA_SY",
    name: "SANA English",
    url: "https://sana.sy/en/feed",
    homepageUrl: "https://sana.sy/en/",
    adapter: "rss",
    country: "SY",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.MARKETS,
    qualityWeight: 70,
  },
  {
    code: "SCMP_CN",
    name: "South China Morning Post Business",
    url: "https://www.scmp.com/rss/91/feed",
    homepageUrl: "https://www.scmp.com/business",
    adapter: "rss",
    country: "CN",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 86,
  },
  {
    code: "NAIRAMETRICS_NG",
    name: "Nairametrics",
    url: "https://nairametrics.com/feed/",
    homepageUrl: "https://nairametrics.com/",
    adapter: "rss",
    country: "NG",
    region: Region.GLOBAL,
    defaultCategory: Category.FINANCE,
    qualityWeight: 82,
  },
  {
    code: "PUNCH_NG",
    name: "Punch Nigeria",
    url: "https://punchng.com/feed/",
    homepageUrl: "https://punchng.com/",
    adapter: "rss",
    country: "NG",
    region: Region.GLOBAL,
    defaultCategory: Category.MARKETS,
    qualityWeight: 78,
  },
  {
    code: "CAPITAL_FM_KE",
    name: "Capital FM Kenya Business",
    url: "https://www.capitalfm.co.ke/business/feed/",
    homepageUrl: "https://www.capitalfm.co.ke/business/",
    adapter: "rss",
    country: "KE",
    region: Region.GLOBAL,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 78,
  },
  {
    code: "ETHIOPIAN_MONITOR_ET",
    name: "Ethiopian Monitor",
    url: "https://www.ethiopianmonitor.com/feed/",
    homepageUrl: "https://www.ethiopianmonitor.com/",
    adapter: "rss",
    country: "ET",
    region: Region.GLOBAL,
    defaultCategory: Category.MARKETS,
    qualityWeight: 74,
  },
  {
    code: "MOSAIQUE_TN",
    name: "Mosaique FM",
    url: "https://www.mosaiquefm.net/fr/rss",
    homepageUrl: "https://www.mosaiquefm.net/fr",
    adapter: "rss",
    country: "TN",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 80,
  },
  {
    code: "AFRICAN_MANAGER_TN",
    name: "African Manager",
    url: "https://africanmanager.com/feed/",
    homepageUrl: "https://africanmanager.com/",
    adapter: "rss",
    country: "TN",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 84,
  },
  {
    code: "LAPRESSE_TN",
    name: "La Presse de Tunisie",
    url: "https://lapresse.tn/feed/",
    homepageUrl: "https://lapresse.tn/",
    adapter: "rss",
    country: "TN",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 78,
  },
  {
    code: "BUSINESS_NEWS_TN",
    name: "Business News Tunisia",
    url: "https://www.businessnews.com.tn/feed",
    homepageUrl: "https://www.businessnews.com.tn/",
    adapter: "rss",
    country: "TN",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 78,
  },
  {
    code: "TAP_TN",
    name: "TAP Tunisia Economy",
    url: "https://www.tap.info.tn/en/rss/economy",
    homepageUrl: "https://www.tap.info.tn/en",
    adapter: "rss",
    country: "TN",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 80,
  },
  {
    code: "TSA_DZ",
    name: "TSA Algeria",
    url: "https://www.tsa-algerie.com/feed/",
    homepageUrl: "https://www.tsa-algerie.com/",
    adapter: "rss",
    country: "DZ",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 76,
  },
  {
    code: "ECOTIMES_DZ",
    name: "Ecotimes Algeria",
    url: "https://www.ecotimesdz.com/feed/",
    homepageUrl: "https://www.ecotimesdz.com/",
    adapter: "rss",
    country: "DZ",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 74,
  },
  {
    code: "CNN_ID_ECON",
    name: "CNN Indonesia Economy",
    url: "https://www.cnnindonesia.com/ekonomi/rss",
    homepageUrl: "https://www.cnnindonesia.com/ekonomi",
    adapter: "rss",
    country: "ID",
    region: Region.GLOBAL,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 80,
  },
  {
    code: "REPUBLIKA_ID",
    name: "Republika Ekonomi",
    url: "https://www.republika.co.id/rss/ekonomi",
    homepageUrl: "https://www.republika.co.id/kanal/ekonomi",
    adapter: "rss",
    country: "ID",
    region: Region.GLOBAL,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 78,
  },
  {
    code: "KHAAMA_AF",
    name: "Khaama Press",
    url: "https://www.khaama.com/feed",
    homepageUrl: "https://www.khaama.com/",
    adapter: "rss",
    country: "AF",
    region: Region.GLOBAL,
    defaultCategory: Category.MARKETS,
    qualityWeight: 72,
  },
  {
    code: "HESPRESS_MA",
    name: "Hespress English",
    url: "https://en.hespress.com/feed",
    homepageUrl: "https://en.hespress.com/",
    adapter: "rss",
    country: "MA",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.ME_ECONOMY,
    qualityWeight: 76,
  },
  {
    code: "DABANGA_SD",
    name: "Radio Dabanga",
    url: "https://www.dabangasudan.org/en/feed/",
    homepageUrl: "https://www.dabangasudan.org/en/",
    adapter: "rss",
    country: "SD",
    region: Region.GLOBAL,
    defaultCategory: Category.MARKETS,
    qualityWeight: 74,
  },
  {
    code: "MEM_PS",
    name: "Middle East Monitor Palestine",
    url: "https://www.middleeastmonitor.com/tags/palestine/feed/",
    homepageUrl: "https://www.middleeastmonitor.com/",
    adapter: "rss",
    country: "PS",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.MARKETS,
    qualityWeight: 72,
  },
  {
    code: "ALMASDAR_YE",
    name: "Al Masdar Online",
    url: "https://www.almasdaronline.com/rss",
    homepageUrl: "https://www.almasdaronline.com/",
    adapter: "rss",
    country: "YE",
    region: Region.MIDDLE_EAST,
    defaultCategory: Category.MARKETS,
    qualityWeight: 70,
  },
  {
    code: "ABC_PY",
    name: "ABC Color",
    url: "https://www.abc.com.py/arc/outboundfeeds/rss/nacionales/",
    homepageUrl: "https://www.abc.com.py/",
    adapter: "rss",
    country: "PY",
    region: Region.GLOBAL,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 82,
  },
  {
    code: "HOY_PY",
    name: "Diario HOY Paraguay",
    url: "https://www.hoy.com.py/feed",
    homepageUrl: "https://www.hoy.com.py/",
    adapter: "rss",
    country: "PY",
    region: Region.GLOBAL,
    defaultCategory: Category.ECONOMICS,
    qualityWeight: 72,
  },
  ...EXPANDED_COUNTRY_SOURCES,
  ...GLOBAL_PUBLISHERS,
  ...INVESTING_SOURCES,
  ...MENA_PUBLISHERS,
  ...COUNTRY_PUBLISHERS,
];

/** Core seed.ts countries that already have dedicated scrape adapters. */
export const CORE_SCRAPE_COUNTRIES = ["KW", "US", "GB"] as const;

const ARABIC_GOOGLE_NEWS_COUNTRIES = new Set([
  "KW", "SA", "AE", "QA", "BH", "OM", "EG", "JO", "IQ", "YE", "PS", "LB",
  "SY", "SD", "MA", "TN", "DZ", "LY", "MR", "DJ", "SO", "KM",
]);

const MIN_SOURCES_PER_COUNTRY = 8;

export function googleNewsRssUrl(query: string, locale: "en" | "ar" = "en") {
  const hl = locale === "ar" ? "ar" : "en-US";
  const gl = locale === "ar" ? "EG" : "US";
  const ceid = locale === "ar" ? "EG:ar" : "US:en";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

function googleNewsSource(
  code: string,
  name: string,
  query: string,
  country: string,
  locale: "en" | "ar" = "en",
  defaultCategory?: Category,
): CountrySourceSeed {
  const region = regionForCountry(country, Region.GLOBAL);
  const category = defaultCategory
    ?? (region === Region.MIDDLE_EAST ? Category.ME_ECONOMY : Category.ECONOMICS);
  return countryRss(
    code,
    name,
    googleNewsRssUrl(query, locale),
    "https://news.google.com/",
    country,
    region,
    category,
    70,
  );
}

const EXTRA_COUNTRY_TOPICS: Array<[string, string, string, Category]> = [
  ["OIL", "Oil", "(oil OR energy OR OPEC OR petroleum OR LNG)", Category.OIL],
  ["FX", "Currency", "(currency OR forex OR \"exchange rate\" OR dollar)", Category.FINANCE],
  ["TRADE", "Trade", "(trade OR exports OR imports OR tariff)", Category.ECONOMICS],
  ["ENERGY", "Energy", "(energy OR electricity OR gas OR fuel)", Category.COMMODITIES],
];

const FILL_COUNTRY_TOPICS: Array<[string, string, string, Category]> = [
  ["STOCKS", "Equities", "(stock market OR equities OR IPO OR shares)", Category.FINANCE],
  ["INFLATION", "Inflation", "(inflation OR CPI OR \"interest rates\" OR prices)", Category.ECONOMICS],
  ["BUDGET", "Fiscal", "(budget OR fiscal OR tax OR \"government spending\")", Category.ECONOMICS],
  ["BANKING", "Banking", "(banking OR credit OR loans OR \"commercial bank\")", Category.FINANCE],
  ["GOLD", "Gold", "(gold OR bullion OR \"precious metals\")", Category.GOLD],
];

/** Broad market topics for every catalog country (adds ~500 supplemental feeds). */
const WIDE_COUNTRY_TOPICS: Array<[string, string, string, Category]> = [
  ["PROPERTY", "Property", "(real estate OR property OR housing OR mortgage)", Category.FINANCE],
  ["TECH", "Tech", "(technology OR fintech OR startups OR \"digital economy\")", Category.MARKETS],
  ["MINING", "Mining", "(mining OR metals OR commodities OR copper)", Category.COMMODITIES],
  ["DEBT", "Debt", "(bonds OR debt OR treasury OR \"sovereign debt\")", Category.FINANCE],
  ["LABOR", "Labor", "(employment OR jobs OR wages OR unemployment)", Category.ECONOMICS],
];

/**
 * Backup coverage for every catalog country so a thin market is not left empty.
 * Existing GNEWS_* rows in COUNTRY_SOURCES are skipped.
 * Oil/currency/trade/energy queries are filler after real publishers.
 */
export function generatedCountrySources(): CountrySourceSeed[] {
  const usedCodes = new Set([
    ...CORE_SOURCE_LOCK.map((item) => item.code),
    ...COUNTRY_SOURCES.map((source) => source.code),
  ]);
  const usedUrls = new Set([
    ...CORE_SOURCE_LOCK.map((item) => item.url),
    ...COUNTRY_SOURCES.map((source) => source.url),
  ]);
  const extra: CountrySourceSeed[] = [];
  const retired = new Set<string>(RETIRED_COUNTRY_SOURCE_CODES);
  const counts = new Map<string, number>();

  for (const source of COUNTRY_SOURCES) {
    if (retired.has(source.code)) continue;
    counts.set(source.country, (counts.get(source.country) ?? 0) + 1);
  }

  const push = (source: CountrySourceSeed) => {
    if (usedCodes.has(source.code) || usedUrls.has(source.url)) return;
    usedCodes.add(source.code);
    usedUrls.add(source.url);
    extra.push(source);
    if (!retired.has(source.code)) {
      counts.set(source.country, (counts.get(source.country) ?? 0) + 1);
    }
  };

  for (const item of COUNTRY_CATALOG) {
    push(googleNewsSource(
      `GNEWS_${item.code}_ECON`,
      `${item.country} Economy`,
      `${item.country} (economy OR markets OR finance OR business)`,
      item.code,
    ));
    push(googleNewsSource(
      `GNEWS_${item.code}_BANK`,
      `${item.country} Policy`,
      `${item.country} ("central bank" OR inflation OR GDP OR currency OR trade OR oil)`,
      item.code,
    ));
    if (ARABIC_GOOGLE_NEWS_COUNTRIES.has(item.code)) {
      push(googleNewsSource(
        `GNEWS_${item.code}_AR`,
        `${item.country} Arabic`,
        `${item.country} (اقتصاد OR أسواق OR مالية OR بنك)`,
        item.code,
        "ar",
      ));
    }
    for (const [suffix, label, query, category] of EXTRA_COUNTRY_TOPICS) {
      push(googleNewsSource(
        `GNEWS_${item.code}_${suffix}`,
        `${item.country} ${label}`,
        `${item.country} ${query}`,
        item.code,
        "en",
        category,
      ));
    }
    for (const [suffix, label, query, category] of FILL_COUNTRY_TOPICS) {
      if ((counts.get(item.code) ?? 0) >= MIN_SOURCES_PER_COUNTRY) break;
      push(googleNewsSource(
        `GNEWS_${item.code}_${suffix}`,
        `${item.country} ${label}`,
        `${item.country} ${query}`,
        item.code,
        "en",
        category,
      ));
    }
    for (const [suffix, label, query, category] of WIDE_COUNTRY_TOPICS) {
      push(googleNewsSource(
        `GNEWS_${item.code}_${suffix}`,
        `${item.country} ${label}`,
        `${item.country} ${query}`,
        item.code,
        "en",
        category,
      ));
    }
  }

  push(googleNewsSource(
    "GNEWS_EU_ECON",
    "Eurozone Economy",
    "Eurozone (economy OR ECB OR inflation OR markets)",
    "EU",
  ));
  push(googleNewsSource(
    "GNEWS_EU_BANK",
    "European Central Bank",
    "(\"European Central Bank\" OR ECB) (rates OR inflation OR euro)",
    "EU",
  ));
  push(googleNewsSource(
    "GNEWS_EU_OIL",
    "Eurozone Energy",
    "Eurozone (oil OR energy OR gas OR LNG)",
    "EU",
    "en",
    Category.OIL,
  ));
  push(googleNewsSource(
    "GNEWS_GLOBAL_ECON",
    "Global Economy",
    "global (economy OR markets OR inflation OR \"central banks\")",
    "GLOBAL",
  ));
  push(googleNewsSource(
    "GNEWS_GLOBAL_OIL",
    "Global Oil",
    "global (oil OR crude OR OPEC OR petroleum)",
    "GLOBAL",
    "en",
    Category.OIL,
  ));
  push(googleNewsSource(
    "GNEWS_GLOBAL_GOLD",
    "Global Gold",
    "global (gold OR bullion OR \"precious metals\")",
    "GLOBAL",
    "en",
    Category.GOLD,
  ));

  return extra;
}

export function allLiveCountrySources() {
  const retired = new Set<string>(RETIRED_COUNTRY_SOURCE_CODES);
  return [...COUNTRY_SOURCES, ...generatedCountrySources()].filter((source) => !retired.has(source.code));
}

export function allSeedSources() {
  const live = allLiveCountrySources();
  const codes = [...CORE_SOURCE_LOCK.map((item) => item.code), ...live.map((source) => source.code)];
  const urls = [...CORE_SOURCE_LOCK.map((item) => item.url), ...live.map((source) => source.url)];
  return { live, codes, urls };
}

export function countriesNeedingArticles(
  catalog: string[],
  counts: Map<string, number>,
  minArticles: number,
) {
  return catalog.filter((code) => (counts.get(code) ?? 0) < minArticles);
}

export function countrySourceCoverage() {
  const retired = new Set<string>(RETIRED_COUNTRY_SOURCE_CODES);
  const covered = new Set<string>(CORE_SCRAPE_COUNTRIES);
  const counts = new Map<string, number>();
  for (const code of CORE_SCRAPE_COUNTRIES) {
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  for (const source of allLiveCountrySources()) {
    if (retired.has(source.code)) continue;
    covered.add(source.country);
    counts.set(source.country, (counts.get(source.country) ?? 0) + 1);
  }
  const catalog = COUNTRY_CATALOG.map((item) => item.code);
  return {
    covered: [...covered].sort(),
    gaps: catalog.filter((code) => !covered.has(code)),
    thin: catalog.filter((code) => (counts.get(code) ?? 0) < MIN_SOURCES_PER_COUNTRY),
    counts,
  };
}
