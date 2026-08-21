import { Category } from "@prisma/client";
import { type CountrySourceSeed, rowsToSources } from "./types";

/**
 * Global / official / wire RSS. URLs are public feeds (not HTML scrapers).
 * Core seed already owns Fed press/monetary/speeches, ECB press, BBC Business,
 * MarketWatch top stories, CNBC Markets, Al Jazeera all, Reuters/Bloomberg sitemaps.
 */
const GLOBAL_ROWS = [
  // US official
  ["FED_BCREG", "Federal Reserve Banking", "https://www.federalreserve.gov/feeds/press_bcreg.xml", "https://www.federalreserve.gov/newsevents.htm", "US", Category.ECONOMICS, 98],
  ["FED_ENFORCEMENT", "Federal Reserve Enforcement", "https://www.federalreserve.gov/feeds/press_enforcement.xml", "https://www.federalreserve.gov/newsevents.htm", "US", Category.ECONOMICS, 96],
  ["FED_OTHER", "Federal Reserve Other Press", "https://www.federalreserve.gov/feeds/press_other.xml", "https://www.federalreserve.gov/newsevents.htm", "US", Category.ECONOMICS, 96],
  ["FED_TESTIMONY", "Federal Reserve Testimony", "https://www.federalreserve.gov/feeds/testimony.xml", "https://www.federalreserve.gov/newsevents/testimony.htm", "US", Category.ECONOMICS, 98],
  ["NY_FED", "New York Fed", "https://www.newyorkfed.org/rss", "https://www.newyorkfed.org/", "US", Category.ECONOMICS, 96],
  ["STLOUIS_FED_BLOG", "FRED Blog", "https://fredblog.stlouisfed.org/feed/", "https://fredblog.stlouisfed.org/", "US", Category.ECONOMICS, 92],
  ["ATLANTA_FED_MACRO", "Atlanta Fed Macroblog", "https://www.atlantafed.org/rss/macroblog", "https://www.atlantafed.org/", "US", Category.ECONOMICS, 90],
  ["CFTC_PRESS", "CFTC Press", "https://www.cftc.gov/RSS/RSS.xml", "https://www.cftc.gov/", "US", Category.MARKETS, 94],
  ["SEC_PRESS", "SEC Press", "https://www.sec.gov/news/pressreleases.rss", "https://www.sec.gov/news/pressreleases", "US", Category.FINANCE, 96],
  ["BLS_NEWS", "US Bureau of Labor Statistics", "https://www.bls.gov/feed/bls_latest.rss", "https://www.bls.gov/", "US", Category.ECONOMICS, 98],
  ["BEA_NEWS", "Bureau of Economic Analysis", "https://www.bea.gov/rss.xml", "https://www.bea.gov/", "US", Category.ECONOMICS, 98],
  ["EIA_TODAY", "EIA Today in Energy", "https://www.eia.gov/rss/todayinenergy.xml", "https://www.eia.gov/todayinenergy/", "US", Category.OIL, 95],
  ["EIA_PRESS", "EIA Press", "https://www.eia.gov/rss/press_feed.xml", "https://www.eia.gov/", "US", Category.OIL, 95],
  ["WHITEHOUSE_BRIEFING", "White House Briefing Room", "https://www.whitehouse.gov/briefing-room/feed/", "https://www.whitehouse.gov/briefing-room/", "US", Category.ECONOMICS, 90],

  // ECB / EU official
  ["ECB_BLOG", "ECB Blog", "https://www.ecb.europa.eu/rss/blog.html", "https://www.ecb.europa.eu/press/blog/html/index.en.html", "EU", Category.ECONOMICS, 96],
  ["ECB_STATS", "ECB Statistical Press", "https://www.ecb.europa.eu/rss/statpress.html", "https://www.ecb.europa.eu/press/pr/stats/html/index.en.html", "EU", Category.ECONOMICS, 98],
  ["ECB_INTERVIEWS", "ECB Interviews", "https://www.ecb.europa.eu/rss/inter.html", "https://www.ecb.europa.eu/press/inter/html/index.en.html", "EU", Category.ECONOMICS, 95],
  ["ECB_PAPERS", "ECB Working Papers", "https://www.ecb.europa.eu/rss/wppub.html", "https://www.ecb.europa.eu/pub/economic-research/working-papers/html/index.en.html", "EU", Category.ECONOMICS, 92],
  ["EC_PRESS", "European Commission Press", "https://ec.europa.eu/commission/presscorner/api/rss?dotcmsid=all&language=en", "https://ec.europa.eu/commission/presscorner/home/en", "EU", Category.ECONOMICS, 94],

  // International institutions
  ["IMF_NEWS", "IMF News", "https://www.imf.org/en/News/rss", "https://www.imf.org/en/News", "GLOBAL", Category.ECONOMICS, 98],
  ["WORLD_BANK_NEWS", "World Bank News", "https://www.worldbank.org/en/news/all/rss", "https://www.worldbank.org/en/news", "GLOBAL", Category.ECONOMICS, 96],
  ["OECD_NEWS", "OECD Newsroom", "https://www.oecd.org/newsroom/rss.xml", "https://www.oecd.org/newsroom/", "GLOBAL", Category.ECONOMICS, 95],
  ["BIS_PRESS", "BIS Press", "https://www.bis.org/doclist/all_pressrels.rss", "https://www.bis.org/press/", "GLOBAL", Category.ECONOMICS, 98],
  ["BIS_SPEECHES", "BIS Speeches", "https://www.bis.org/doclist/speeches.rss", "https://www.bis.org/speeches/", "GLOBAL", Category.ECONOMICS, 96],
  ["WTO_NEWS", "WTO News", "https://www.wto.org/library/rss/latest_news_e.xml", "https://www.wto.org/english/news_e/news_e.htm", "GLOBAL", Category.ECONOMICS, 94],
  ["UN_ECONOMIC", "UN Economic Development", "https://news.un.org/feed/subscribe/en/news/topic/economic-development/feed/rss.xml", "https://news.un.org/en/news/topic/economic-development", "GLOBAL", Category.ECONOMICS, 90],
  ["IEA_NEWS", "International Energy Agency", "https://www.iea.org/feeds/news.rss", "https://www.iea.org/news", "GLOBAL", Category.OIL, 94],
  ["OPEC_PRESS", "OPEC Press", "https://www.opec.org/opec_web/static_files_project/media/rss/press_releases.xml", "https://www.opec.org/", "GLOBAL", Category.OIL, 94],

  // UK official / BBC extra
  ["BOE_NEWS", "Bank of England News", "https://www.bankofengland.co.uk/rss/news", "https://www.bankofengland.co.uk/news", "GB", Category.ECONOMICS, 100],
  ["BOE_PUBLICATIONS", "Bank of England Publications", "https://www.bankofengland.co.uk/rss/publications", "https://www.bankofengland.co.uk/news", "GB", Category.ECONOMICS, 96],
  ["BOE_SPEECHES", "Bank of England Speeches", "https://www.bankofengland.co.uk/rss/speeches", "https://www.bankofengland.co.uk/news", "GB", Category.ECONOMICS, 97],
  ["BBC_WORLD", "BBC World", "https://feeds.bbci.co.uk/news/world/rss.xml", "https://www.bbc.com/news/world", "GB", Category.MARKETS, 90],
  ["BBC_UK", "BBC UK", "https://feeds.bbci.co.uk/news/uk/rss.xml", "https://www.bbc.com/news/uk", "GB", Category.MARKETS, 86],
  ["BBC_POLITICS", "BBC Politics", "https://feeds.bbci.co.uk/news/politics/rss.xml", "https://www.bbc.com/news/politics", "GB", Category.ECONOMICS, 84],
  ["BBC_SCIENCE", "BBC Science Environment", "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", "https://www.bbc.com/news/science_and_environment", "GB", Category.COMMODITIES, 78],
  ["SKY_BUSINESS", "Sky News Business", "https://feeds.skynews.com/feeds/rss/business.xml", "https://news.sky.com/business", "GB", Category.FINANCE, 84],
  ["SKY_WORLD", "Sky News World", "https://feeds.skynews.com/feeds/rss/world.xml", "https://news.sky.com/world", "GB", Category.MARKETS, 82],
  ["GUARDIAN_BUSINESS", "The Guardian Business", "https://www.theguardian.com/uk/business/rss", "https://www.theguardian.com/uk/business", "GB", Category.FINANCE, 88],
  ["GUARDIAN_ECONOMICS", "The Guardian Economics", "https://www.theguardian.com/business/economics/rss", "https://www.theguardian.com/business/economics", "GB", Category.ECONOMICS, 88],
  ["GUARDIAN_US_BUSINESS", "The Guardian US Business", "https://www.theguardian.com/us/business/rss", "https://www.theguardian.com/us/business", "US", Category.FINANCE, 86],
  ["INDEPENDENT_UK_BUSINESS", "The Independent Business", "https://www.independent.co.uk/news/business/rss", "https://www.independent.co.uk/news/business", "GB", Category.FINANCE, 82],
  ["CITY_AM", "City AM", "https://www.cityam.com/feed/", "https://www.cityam.com/", "GB", Category.FINANCE, 82],
  ["FT_HOME", "Financial Times Home", "https://www.ft.com/rss/home", "https://www.ft.com/", "GB", Category.FINANCE, 94],
  ["FT_MARKETS", "Financial Times Markets", "https://www.ft.com/markets?format=rss", "https://www.ft.com/markets", "GB", Category.FINANCE, 94],
  ["FT_WORLD", "Financial Times World", "https://www.ft.com/world?format=rss", "https://www.ft.com/world", "GLOBAL", Category.MARKETS, 92],

  // US wires / business press
  ["NYT_BUSINESS", "NYTimes Business", "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", "https://www.nytimes.com/section/business", "US", Category.FINANCE, 92],
  ["NYT_ECONOMY", "NYTimes Economy", "https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml", "https://www.nytimes.com/section/business/economy", "US", Category.ECONOMICS, 92],
  ["NYT_DEALBOOK", "NYTimes DealBook", "https://rss.nytimes.com/services/xml/rss/nyt/Dealbook.xml", "https://www.nytimes.com/section/business/dealbook", "US", Category.FINANCE, 90],
  ["NYT_ENERGY", "NYTimes Energy Environment", "https://rss.nytimes.com/services/xml/rss/nyt/EnergyEnvironment.xml", "https://www.nytimes.com/section/business/energy-environment", "US", Category.OIL, 86],
  ["WSJ_WORLD", "WSJ World News", "https://feeds.a.dj.com/rss/RSSWorldNews.xml", "https://www.wsj.com/news/world", "GLOBAL", Category.MARKETS, 94],
  ["WSJ_MARKETS", "WSJ Markets", "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", "https://www.wsj.com/news/markets", "US", Category.FINANCE, 95],
  ["WSJ_BUSINESS", "WSJ US Business", "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml", "https://www.wsj.com/news/business", "US", Category.FINANCE, 94],
  ["NPR_BUSINESS", "NPR Business", "https://feeds.npr.org/1006/rss.xml", "https://www.npr.org/sections/business/", "US", Category.FINANCE, 88],
  ["NPR_ECONOMY", "NPR Economy", "https://feeds.npr.org/1017/rss.xml", "https://www.npr.org/sections/economy/", "US", Category.ECONOMICS, 88],
  ["CNBC_TOP", "CNBC Top News", "https://www.cnbc.com/id/100003114/device/rss/rss.html", "https://www.cnbc.com/", "US", Category.MARKETS, 88],
  ["CNBC_WORLD", "CNBC World", "https://www.cnbc.com/id/100727362/device/rss/rss.html", "https://www.cnbc.com/world/", "GLOBAL", Category.MARKETS, 88],
  ["CNBC_ECONOMY", "CNBC Economy", "https://www.cnbc.com/id/20910258/device/rss/rss.html", "https://www.cnbc.com/economy/", "US", Category.ECONOMICS, 90],
  ["CNBC_FINANCE", "CNBC Finance", "https://www.cnbc.com/id/10000664/device/rss/rss.html", "https://www.cnbc.com/finance/", "US", Category.FINANCE, 88],
  ["CNBC_EARNINGS", "CNBC Earnings", "https://www.cnbc.com/id/15839135/device/rss/rss.html", "https://www.cnbc.com/earnings/", "US", Category.FINANCE, 86],
  ["CNBC_ENERGY", "CNBC Energy", "https://www.cnbc.com/id/19836768/device/rss/rss.html", "https://www.cnbc.com/energy/", "US", Category.OIL, 86],
  ["CNBC_ASIA", "CNBC Asia", "https://www.cnbc.com/id/10000113/device/rss/rss.html", "https://www.cnbc.com/asia-business/", "GLOBAL", Category.FINANCE, 86],
  ["CNBC_CRYPTO", "CNBC Crypto", "https://www.cnbc.com/id/44877279/device/rss/rss.html", "https://www.cnbc.com/cryptoworld/", "US", Category.FINANCE, 84],
  ["MARKETWATCH_PULSE", "MarketWatch Pulse", "https://feeds.marketwatch.com/marketwatch/marketpulse/", "https://www.marketwatch.com/", "US", Category.FINANCE, 86],
  ["MARKETWATCH_REALTIME", "MarketWatch Realtime", "https://feeds.marketwatch.com/marketwatch/realtimeheadlines/", "https://www.marketwatch.com/", "US", Category.FINANCE, 86],
  ["YAHOO_FINANCE", "Yahoo Finance News", "https://finance.yahoo.com/news/rssindex", "https://finance.yahoo.com/news/", "US", Category.FINANCE, 84],
  ["CNN_MONEY", "CNN Money Latest", "http://rss.cnn.com/rss/money_latest.rss", "https://www.cnn.com/business", "US", Category.FINANCE, 84],
  ["CNN_ECONOMY", "CNN Money Economy", "http://rss.cnn.com/rss/money_news_economy.rss", "https://www.cnn.com/business", "US", Category.ECONOMICS, 84],
  ["CNN_MARKETS", "CNN Money Markets", "http://rss.cnn.com/rss/money_markets.rss", "https://www.cnn.com/business/markets", "US", Category.FINANCE, 84],
  ["FORTUNE", "Fortune", "https://fortune.com/feed/", "https://fortune.com/", "US", Category.FINANCE, 84],
  ["BUSINESS_INSIDER", "Business Insider", "https://www.businessinsider.com/rss", "https://www.businessinsider.com/", "US", Category.FINANCE, 80],
  ["SEEKING_ALPHA", "Seeking Alpha Market Currents", "https://seekingalpha.com/market_currents.xml", "https://seekingalpha.com/", "US", Category.FINANCE, 80],
  ["WASHPOST_BUSINESS", "Washington Post Business", "https://feeds.washingtonpost.com/rss/business", "https://www.washingtonpost.com/business/", "US", Category.FINANCE, 88],
  ["POLITICO_ECONOMY", "Politico Economy", "https://rss.politico.com/economy.xml", "https://www.politico.com/economy", "US", Category.ECONOMICS, 82],
  ["HILL_BUSINESS", "The Hill Finance", "https://thehill.com/business/feed/", "https://thehill.com/business/", "US", Category.ECONOMICS, 76],

  // Wires / international
  ["FRANCE24_EN", "France 24 English", "https://www.france24.com/en/rss", "https://www.france24.com/en/", "FR", Category.MARKETS, 86],
  ["FRANCE24_BUSINESS", "France 24 Business", "https://www.france24.com/en/business/rss", "https://www.france24.com/en/business/", "FR", Category.FINANCE, 86],
  ["FRANCE24_ECO", "France 24 Economy", "https://www.france24.com/en/economy/rss", "https://www.france24.com/en/economy/", "FR", Category.ECONOMICS, 86],
  ["RFI_EN", "RFI English", "https://www.rfi.fr/en/rss", "https://www.rfi.fr/en/", "FR", Category.MARKETS, 82],
  ["DW_ALL", "Deutsche Welle English", "https://rss.dw.com/rdf/rss-en-all", "https://www.dw.com/en/", "DE", Category.MARKETS, 86],
  ["DW_ECONOMY", "Deutsche Welle Economy", "https://rss.dw.com/xml/rss-en-eco", "https://www.dw.com/en/economy/s-12776", "DE", Category.ECONOMICS, 86],
  ["REUTERS_AGENCY_BIZ", "Reuters Agency Business", "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best", "https://www.reutersagency.com/", "GLOBAL", Category.FINANCE, 94],
  ["REUTERS_AGENCY_ECON", "Reuters Agency Economy", "https://www.reutersagency.com/feed/?best-topics=economy&post_type=best", "https://www.reutersagency.com/", "GLOBAL", Category.ECONOMICS, 94],

  // Commodities / mining / energy
  ["OILPRICE", "OilPrice", "https://oilprice.com/rss/main", "https://oilprice.com/", "GLOBAL", Category.OIL, 88],
  ["MINING_COM", "Mining.com", "https://www.mining.com/feed/", "https://www.mining.com/", "GLOBAL", Category.COMMODITIES, 88],
  ["BULLIONVAULT", "BullionVault News", "https://www.bullionvault.com/gold-news/rss", "https://www.bullionvault.com/gold-news", "GLOBAL", Category.GOLD, 84],
  ["RIGZONE", "Rigzone", "https://www.rigzone.com/news/rss.asp", "https://www.rigzone.com/news/", "GLOBAL", Category.OIL, 80],

  // Asia official / English
  ["BOJ_WHATSNEW", "Bank of Japan", "https://www.boj.or.jp/en/rss/whatsnew.xml", "https://www.boj.or.jp/en/", "JP", Category.ECONOMICS, 100],
  ["CHINA_DAILY_BIZ", "China Daily Business", "https://www.chinadaily.com.cn/rss/business_rss.xml", "https://www.chinadaily.com.cn/business", "CN", Category.FINANCE, 82],
  ["CHINA_DAILY_CHINA", "China Daily China", "https://www.chinadaily.com.cn/rss/china_rss.xml", "https://www.chinadaily.com.cn/", "CN", Category.MARKETS, 80],
  ["XINHUA_EN", "Xinhua English World", "https://www.xinhuanet.com/english/rss/worldrss.xml", "https://english.news.cn/", "CN", Category.MARKETS, 80],
  ["CAIXIN_GLOBAL", "Caixin Global", "https://www.caixinglobal.com/feed/", "https://www.caixinglobal.com/", "CN", Category.FINANCE, 86],
  ["NIKKEI_ASIA", "Nikkei Asia", "https://asia.nikkei.com/rss/feed/nar", "https://asia.nikkei.com/", "JP", Category.FINANCE, 90],
  ["NHK_WORLD", "NHK World", "https://www3.nhk.or.jp/nhkworld/en/news/rss/", "https://www3.nhk.or.jp/nhkworld/", "JP", Category.MARKETS, 86],

  // Canada / Australia / others extra
  ["CBC_BUSINESS", "CBC Business", "https://www.cbc.ca/webfeed/rss/rss-business", "https://www.cbc.ca/news/business", "CA", Category.FINANCE, 86],
  ["GLOBE_MAIL_BIZ", "Globe and Mail Business", "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/business/", "https://www.theglobeandmail.com/business/", "CA", Category.FINANCE, 86],
  ["BOC_PRESS", "Bank of Canada Press", "https://www.bankofcanada.ca/press/feed/", "https://www.bankofcanada.ca/", "CA", Category.ECONOMICS, 98],
  ["RBA_MEDIA", "Reserve Bank of Australia", "https://www.rba.gov.au/rss/rss-cb-media-releases.xml", "https://www.rba.gov.au/media-releases/", "AU", Category.ECONOMICS, 100],
  ["RBNZ_NEWS", "Reserve Bank of New Zealand", "https://www.rbnz.govt.nz/feeds/news", "https://www.rbnz.govt.nz/", "NZ", Category.ECONOMICS, 98],

  // Extra global English business
  ["MIDDLE_EAST_EYE", "Middle East Eye", "https://www.middleeasteye.net/rss", "https://www.middleeasteye.net/", "GLOBAL", Category.ME_ECONOMY, 78],
  ["MEI_NEWS", "Middle East Institute", "https://www.mei.edu/feed", "https://www.mei.edu/", "GLOBAL", Category.ME_ECONOMY, 76],
  ["ATLANTIC_COUNCIL", "Atlantic Council", "https://www.atlanticcouncil.org/feed/", "https://www.atlanticcouncil.org/", "GLOBAL", Category.ECONOMICS, 76],
  ["BROOKINGS", "Brookings", "https://www.brookings.edu/feed/", "https://www.brookings.edu/", "US", Category.ECONOMICS, 82],
  ["PIIE", "Peterson Institute", "https://www.piie.com/rss.xml", "https://www.piie.com/", "US", Category.ECONOMICS, 86],
  ["VOXEU", "VoxEU", "https://cepr.org/voxeu/rss.xml", "https://cepr.org/voxeu", "EU", Category.ECONOMICS, 84],
  ["PROJECT_SYNDICATE", "Project Syndicate", "https://www.project-syndicate.org/rss", "https://www.project-syndicate.org/", "GLOBAL", Category.ECONOMICS, 80],
] as const;

export const GLOBAL_PUBLISHERS: CountrySourceSeed[] = rowsToSources([...GLOBAL_ROWS]);
