import { Category } from "@prisma/client";
import { type CountrySourceSeed, type PublisherRow, rowsToSources } from "./types";

type SectionRow = readonly [
  suffix: string,
  label: string,
  feedPath: string,
  homePath: string,
  category: Category,
  weight: number,
];

function rowsFor(
  prefix: string,
  publisher: string,
  baseUrl: string,
  country: string,
  sections: readonly SectionRow[],
): PublisherRow[] {
  return sections.map(([suffix, label, feedPath, homePath, category, weight]) => [
    `${prefix}_${suffix}`,
    `${publisher} ${label}`,
    new URL(feedPath, baseUrl).toString(),
    new URL(homePath, baseUrl).toString(),
    country,
    category,
    weight,
  ]);
}

const BUSINESS_SECTIONS = [
  ["BUSINESS", "Business", "business/feed/", "business/", Category.ME_ECONOMY, 82],
  ["ECONOMY", "Economy", "economy/feed/", "economy/", Category.ECONOMICS, 82],
  ["FINANCE", "Finance", "finance/feed/", "finance/", Category.FINANCE, 82],
  ["MARKETS", "Markets", "markets/feed/", "markets/", Category.MARKETS, 80],
  ["ENERGY", "Energy", "energy/feed/", "energy/", Category.OIL, 80],
  ["BANKING", "Banking", "banking/feed/", "banking/", Category.FINANCE, 80],
] as const satisfies readonly SectionRow[];

const CATEGORY_BUSINESS_SECTIONS = [
  ["BUSINESS", "Business", "category/business/feed/", "category/business/", Category.ME_ECONOMY, 82],
  ["ECONOMY", "Economy", "category/economy/feed/", "category/economy/", Category.ECONOMICS, 82],
  ["FINANCE", "Finance", "category/finance/feed/", "category/finance/", Category.FINANCE, 82],
  ["MARKETS", "Markets", "category/markets/feed/", "category/markets/", Category.MARKETS, 80],
  ["ENERGY", "Energy", "category/energy/feed/", "category/energy/", Category.OIL, 80],
  ["BANKING", "Banking", "category/banking/feed/", "category/banking/", Category.FINANCE, 80],
] as const satisfies readonly SectionRow[];

const MENA_ROWS = [
  // Gulf business publishers and section feeds.
  ...rowsFor("GULF_BUSINESS", "Gulf Business", "https://gulfbusiness.com/", "AE", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("GULF_BUSINESS_INDUSTRY", "Gulf Business", "https://gulfbusiness.com/", "AE", [
    ["BANKING_FINANCE", "Banking Finance", "category/banking-finance/feed/", "category/banking-finance/", Category.FINANCE, 84],
    ["AVIATION", "Aviation", "category/aviation/feed/", "category/aviation/", Category.MARKETS, 78],
    ["REAL_ESTATE", "Real Estate", "category/real-estate/feed/", "category/real-estate/", Category.FINANCE, 78],
    ["RETAIL", "Retail", "category/retail/feed/", "category/retail/", Category.FINANCE, 76],
  ]),
  ...rowsFor("ARABIAN_BUSINESS", "Arabian Business", "https://www.arabianbusiness.com/", "AE", [
    ["BANKING_FINANCE", "Banking Finance", "industries/banking-finance/feed", "industries/banking-finance/", Category.FINANCE, 84],
    ["ENERGY", "Energy", "industries/energy/feed", "industries/energy/", Category.OIL, 82],
    ["MARKETS", "Markets", "markets/feed", "markets/", Category.MARKETS, 82],
    ["REAL_ESTATE", "Real Estate", "industries/real-estate/feed", "industries/real-estate/", Category.FINANCE, 80],
    ["RETAIL", "Retail", "industries/retail/feed", "industries/retail/", Category.FINANCE, 78],
    ["TRANSPORT", "Transport", "industries/transport/feed", "industries/transport/", Category.MARKETS, 76],
  ]),
  ...rowsFor("ECONOMY_ME", "Economy Middle East", "https://economymiddleeast.com/", "AE", [
    ["BANKING_FINANCE", "Banking Finance", "category/banking-finance/feed/", "category/banking-finance/", Category.FINANCE, 84],
    ["ECONOMY", "Economy", "category/economy/feed/", "category/economy/", Category.ECONOMICS, 84],
    ["ENERGY", "Energy", "category/energy/feed/", "category/energy/", Category.OIL, 82],
    ["MARKETS", "Markets", "category/markets/feed/", "category/markets/", Category.MARKETS, 82],
    ["REAL_ESTATE", "Real Estate", "category/real-estate/feed/", "category/real-estate/", Category.FINANCE, 80],
    ["TECH", "Technology", "category/technology/feed/", "category/technology/", Category.MARKETS, 78],
  ]),
  ...rowsFor("THE_NATIONAL_BUSINESS", "The National", "https://www.thenationalnews.com/", "AE", [
    ["BANKING", "Banking", "business/banking/rss.xml", "business/banking/", Category.FINANCE, 86],
    ["ENERGY", "Energy", "business/energy/rss.xml", "business/energy/", Category.OIL, 86],
    ["MARKETS", "Markets", "business/markets/rss.xml", "business/markets/", Category.MARKETS, 86],
    ["MONEY", "Money", "business/money/rss.xml", "business/money/", Category.FINANCE, 84],
    ["PROPERTY", "Property", "business/property/rss.xml", "business/property/", Category.FINANCE, 84],
    ["TECHNOLOGY", "Technology", "business/technology/rss.xml", "business/technology/", Category.MARKETS, 82],
    ["TRAVEL_TOURISM", "Travel Tourism", "business/travel-and-tourism/rss.xml", "business/travel-and-tourism/", Category.MARKETS, 80],
    ["UAE", "UAE", "uae/rss.xml", "uae/", Category.ME_ECONOMY, 84],
    ["MENA", "MENA", "mena/rss.xml", "mena/", Category.ME_ECONOMY, 84],
  ]),
  ...rowsFor("ZAWYA", "Zawya", "https://www.zawya.com/", "AE", [
    ["ECONOMY", "Economy", "rss/economy", "economy/", Category.ECONOMICS, 84],
    ["MARKETS", "Markets", "rss/markets", "markets/", Category.MARKETS, 84],
    ["BANKING", "Banking", "rss/banking", "business/banking/", Category.FINANCE, 82],
    ["ENERGY", "Energy", "rss/energy", "business/energy/", Category.OIL, 82],
    ["REAL_ESTATE", "Real Estate", "rss/real-estate", "business/real-estate/", Category.FINANCE, 80],
    ["WEALTH", "Wealth", "rss/wealth", "wealth/", Category.FINANCE, 80],
  ]),
  ...rowsFor("MEED", "MEED", "https://www.meed.com/", "AE", [
    ["NEWS", "News", "feed/", "", Category.ME_ECONOMY, 82],
    ["SAUDI", "Saudi Arabia", "category/saudi-arabia/feed/", "category/saudi-arabia/", Category.ME_ECONOMY, 80],
    ["UAE", "UAE", "category/uae/feed/", "category/uae/", Category.ME_ECONOMY, 80],
    ["QATAR", "Qatar", "category/qatar/feed/", "category/qatar/", Category.ME_ECONOMY, 78],
    ["KUWAIT", "Kuwait", "category/kuwait/feed/", "category/kuwait/", Category.ME_ECONOMY, 92],
    ["OMAN", "Oman", "category/oman/feed/", "category/oman/", Category.ME_ECONOMY, 78],
  ]),
  ...rowsFor("AGBI", "Arabian Gulf Business Insight", "https://www.agbi.com/", "AE", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("CONSTRUCTION_WEEK_ME", "Construction Week Middle East", "https://www.constructionweekonline.com/", "AE", [
    ["BUSINESS", "Business", "business/feed", "business/", Category.FINANCE, 78],
    ["PROJECTS", "Projects", "projects/feed", "projects/", Category.MARKETS, 78],
    ["REAL_ESTATE", "Real Estate", "real-estate/feed", "real-estate/", Category.FINANCE, 78],
    ["SAUDI", "Saudi Arabia", "saudi-arabia/feed", "saudi-arabia/", Category.ME_ECONOMY, 78],
    ["UAE", "UAE", "uae/feed", "uae/", Category.ME_ECONOMY, 78],
  ]),
  ...rowsFor("CAMPAIGN_ME", "Campaign Middle East", "https://campaignme.com/", "AE", [
    ["NEWS", "News", "feed/", "", Category.MARKETS, 74],
    ["MEDIA", "Media", "category/media/feed/", "category/media/", Category.MARKETS, 74],
    ["MARKETING", "Marketing", "category/marketing/feed/", "category/marketing/", Category.MARKETS, 74],
  ]),

  // Kuwait and Saudi local density — KW oil/energy/business weighted for investor desk.
  ...rowsFor("KUWAIT_TIMES", "Kuwait Times", "https://www.kuwaittimes.com/", "KW", [
    ["BUSINESS", "Business", "category/business/feed/", "category/business/", Category.ME_ECONOMY, 90],
    ["ECONOMY", "Economy", "category/economy/feed/", "category/economy/", Category.ECONOMICS, 90],
    ["FINANCE", "Finance", "category/finance/feed/", "category/finance/", Category.FINANCE, 90],
    ["MARKETS", "Markets", "category/markets/feed/", "category/markets/", Category.MARKETS, 88],
    ["ENERGY", "Energy", "category/energy/feed/", "category/energy/", Category.OIL, 94],
    ["BANKING", "Banking", "category/banking/feed/", "category/banking/", Category.FINANCE, 88],
  ]),
  ...rowsFor("TIMES_KUWAIT", "The Times Kuwait", "https://timeskuwait.com/", "KW", [
    ["LOCAL", "Local", "category/local/feed/", "category/local/", Category.ME_ECONOMY, 82],
    ["BUSINESS_EXTRA", "Business Extra", "category/business/feed/?briefly=1", "category/business/", Category.ME_ECONOMY, 90],
    ["OIL", "Oil", "tag/oil/feed/", "tag/oil/", Category.OIL, 94],
    ["ECONOMY", "Economy", "tag/economy/feed/", "tag/economy/", Category.ECONOMICS, 90],
  ]),
  ...rowsFor("KUWAIT_LOCAL", "Kuwait Local", "https://www.kuwaitlocal.com/", "KW", [
    ["NEWS", "News", "news/feed", "news/", Category.ME_ECONOMY, 80],
    ["BUSINESS", "Business", "news/business/feed", "news/business/", Category.ME_ECONOMY, 84],
    ["ECONOMY", "Economy", "news/economy/feed", "news/economy/", Category.ECONOMICS, 84],
  ]),
  ...rowsFor("SAUDI_GAZETTE", "Saudi Gazette", "https://saudigazette.com.sa/", "SA", [
    ["SAUDI", "Saudi Arabia", "rss/saudi-arabia", "saudi-arabia/", Category.ME_ECONOMY, 80],
    ["BUSINESS_EXTRA", "Business Extra", "rss/business?briefly=1", "business/", Category.ME_ECONOMY, 80],
    ["WORLD", "World", "rss/world", "world/", Category.MARKETS, 76],
  ]),

  // Qatar, Bahrain, Oman.
  ...rowsFor("DOHA_NEWS", "Doha News", "https://dohanews.co/", "QA", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("PENINSULA_QA", "The Peninsula Qatar", "https://thepeninsulaqatar.com/", "QA", [
    ["BUSINESS", "Business", "rss/business", "business/", Category.ME_ECONOMY, 80],
    ["QATAR", "Qatar", "rss/qatar", "qatar/", Category.ME_ECONOMY, 78],
    ["WORLD", "World", "rss/world", "world/", Category.MARKETS, 76],
  ]),
  ...rowsFor("BAHRAIN_THIS_WEEK", "Bahrain This Week", "https://www.bahrainthisweek.com/", "BH", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("DAILY_TRIBUNE_BH", "Daily Tribune Bahrain", "https://www.dt.bh/", "BH", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("OMAN_OBSERVER", "Oman Observer", "https://www.omanobserver.om/", "OM", [
    ["ECONOMY", "Economy", "category/business/economy/feed/", "category/business/economy/", Category.ECONOMICS, 80],
    ["MARKETS", "Markets", "category/business/markets/feed/", "category/business/markets/", Category.MARKETS, 78],
    ["OIL", "Oil", "tag/oil/feed/", "tag/oil/", Category.OIL, 78],
    ["OMAN", "Oman", "category/oman/feed/", "category/oman/", Category.ME_ECONOMY, 78],
  ]),
  ...rowsFor("MUSCAT_DAILY", "Muscat Daily", "https://www.muscatdaily.com/", "OM", CATEGORY_BUSINESS_SECTIONS),

  // Egypt, Levant, Iraq, and North Africa.
  ...rowsFor("DAILY_NEWS_EGYPT", "Daily News Egypt", "https://www.dailynewsegypt.com/", "EG", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("EGYPT_INDEPENDENT", "Egypt Independent", "https://www.egyptindependent.com/", "EG", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("MADA_MASR", "Mada Masr", "https://www.madamasr.com/en/", "EG", [
    ["ECONOMY", "Economy", "topic/economy/feed/", "topic/economy/", Category.ECONOMICS, 76],
    ["POLITICS", "Politics", "topic/politics/feed/", "topic/politics/", Category.MARKETS, 74],
  ]),
  ...rowsFor("BEIRUT_TODAY", "Beirut Today", "https://beirut-today.com/", "LB", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("IRAQ_BUSINESS_NEWS", "Iraq Business News", "https://www.iraq-businessnews.com/", "IQ", [
    ["BANKING_FINANCE", "Banking Finance", "category/banking-finance/feed/", "category/banking-finance/", Category.FINANCE, 82],
    ["ECONOMY", "Economy", "category/economy/feed/", "category/economy/", Category.ECONOMICS, 82],
    ["ENERGY", "Energy", "category/oil-gas/feed/", "category/oil-gas/", Category.OIL, 82],
    ["INVESTMENT", "Investment", "category/investment/feed/", "category/investment/", Category.FINANCE, 80],
    ["TRANSPORT", "Transport", "category/transport/feed/", "category/transport/", Category.MARKETS, 76],
  ]),
  ...rowsFor("LIBYA_UPDATE", "Libya Update", "https://libyaupdate.com/", "LY", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("LIBYA_HERALD", "Libya Herald", "https://www.libyaherald.com/", "LY", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("MOROCCO_WORLD_NEWS", "Morocco World News", "https://www.moroccoworldnews.com/", "MA", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("NORTH_AFRICA_POST", "North Africa Post", "https://northafricapost.com/", "MA", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("AFRICAN_MANAGER", "African Manager", "https://africanmanager.com/", "TN", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("WEBMANAGER_TN", "Webmanagercenter", "https://www.webmanagercenter.com/", "TN", BUSINESS_SECTIONS),
  ...rowsFor("KAPITALIS_TN", "Kapitalis", "https://kapitalis.com/tunisie/", "TN", [
    ["ECONOMIE", "Economie", "category/economie/feed/", "category/economie/", Category.ECONOMICS, 74],
    ["FINANCE", "Finance", "category/finance/feed/", "category/finance/", Category.FINANCE, 74],
    ["ENTREPRISES", "Entreprises", "category/entreprises/feed/", "category/entreprises/", Category.FINANCE, 74],
  ]),
  ...rowsFor("ECOTIMES_DZ", "Ecotimes Algeria", "https://www.ecotimesdz.com/", "DZ", CATEGORY_BUSINESS_SECTIONS),
  ...rowsFor("APS_DZ", "Algeria Press Service", "https://www.aps.dz/", "DZ", [
    ["ECONOMY", "Economy", "en/economy?format=feed&type=rss", "en/economy", Category.ECONOMICS, 80],
    ["ENERGY", "Energy", "en/energy?format=feed&type=rss", "en/energy", Category.OIL, 78],
    ["FINANCE", "Finance", "en/finance?format=feed&type=rss", "en/finance", Category.FINANCE, 78],
  ]),
] as const;

export const MENA_PUBLISHERS: CountrySourceSeed[] = rowsToSources(MENA_ROWS);
