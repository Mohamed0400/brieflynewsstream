import { Category, Region } from "@prisma/client";
import { regionForCountry } from "./classify";
import { googleNewsRssUrl } from "./country-sources";
import { arabicGoogleNewsRss } from "./sources/types";
import { ARABIC_NATIVE_PUBLISHERS } from "./sources/arabic-publishers";

function arGNews(
  code: string,
  name: string,
  query: string,
  country: string,
  defaultCategory: Category,
  qualityWeight: number,
) {
  const region = regionForCountry(country, Region.GLOBAL);
  return arabicGoogleNewsRss(
    code,
    name,
    query,
    "https://news.google.com/",
    country,
    region,
    defaultCategory,
    qualityWeight,
    googleNewsRssUrl(query, "ar"),
  );
}

/** Google News Arabic search feeds — Kuwait, global desk, China, Europe. */
const ARABIC_GOOGLE_NEWS_SOURCES = [
  // Kuwait — focused desk
  arGNews(
    "AR_GN_KW_GOLD",
    "Kuwait Gold Arabic",
    "الكويت (ذهب OR سبائك OR معادن OR \"أسعار الذهب\")",
    "KW",
    Category.GOLD,
    98,
  ),
  arGNews(
    "AR_GN_KW_OIL",
    "Kuwait Oil Arabic",
    "الكويت (نفط OR بترول OR غاز OR KOC OR KPC OR \"شركة نفط\")",
    "KW",
    Category.OIL,
    98,
  ),
  arGNews(
    "AR_GN_KW_ENERGY",
    "Kuwait Energy Arabic",
    "الكويت (طاقة OR كهرباء OR وقود OR \"وزارة الكهرباء\")",
    "KW",
    Category.ENERGY,
    95,
  ),
  arGNews(
    "AR_GN_KW_ECON",
    "Kuwait Economy Arabic",
    "الكويت (اقتصاد OR أسواق OR مالية OR بنك OR استثمار OR بورصة)",
    "KW",
    Category.ME_ECONOMY,
    96,
  ),
  arGNews(
    "AR_GN_KW_MARKETS",
    "Kuwait Markets Arabic",
    "الكويت (بورصة OR أسهم OR \"صندوق استثمار\" OR \"سوق المال\")",
    "KW",
    Category.MARKETS,
    94,
  ),
  arGNews(
    "AR_GN_KW_BANK",
    "Kuwait Banking Arabic",
    "الكويت (بنك OR \"بنك مركزي\" OR CBK OR ائتمان OR قروض)",
    "KW",
    Category.BANKING,
    93,
  ),
  arGNews(
    "AR_GN_KW_TRADE",
    "Kuwait Trade Arabic",
    "الكويت (تجارة OR صادرات OR واردات OR \"المنطقة الحرة\")",
    "KW",
    Category.TRADE,
    90,
  ),
  arGNews(
    "AR_GN_KW_INVEST",
    "Kuwait Investment Arabic",
    "الكويت (استثمار OR \"الهيئة العامة للاستثمار\" OR KIA OR \"صندوق سيادي\")",
    "KW",
    Category.FINANCE,
    94,
  ),
  arGNews(
    "AR_GN_KW_FX",
    "Kuwait Currency Arabic",
    "الكويت (دينار OR عملة OR \"سعر الصرف\" OR فائدة)",
    "KW",
    Category.FX,
    88,
  ),
  arGNews(
    "AR_GN_KW_ALL",
    "Kuwait News Arabic",
    "الكويت (اقتصاد OR أعمال OR أسواق OR نفط OR ذهب)",
    "KW",
    Category.ME_ECONOMY,
    92,
  ),

  // Global desk — gold, markets, oil
  arGNews(
    "AR_GN_GLOBAL_GOLD",
    "Global Gold Arabic",
    "(ذهب OR سبائك OR \"أسعار الذهب\" OR XAU OR \"المجلس العالمي للذهب\")",
    "GLOBAL",
    Category.GOLD,
    97,
  ),
  arGNews(
    "AR_GN_GLOBAL_OIL",
    "Global Oil Arabic",
    "(نفط OR بترول OR OPEC OR \"أسعار النفط\" OR غاز OR LNG)",
    "GLOBAL",
    Category.OIL,
    94,
  ),
  arGNews(
    "AR_GN_GLOBAL_ENERGY",
    "Global Energy Arabic",
    "(طاقة OR كهرباء OR \"محطات الطاقة\" OR \"الطاقة المتجددة\")",
    "GLOBAL",
    Category.ENERGY,
    90,
  ),
  arGNews(
    "AR_GN_GLOBAL_MARKETS",
    "Global Markets Arabic",
    "(أسواق OR \"سوق الأسهم\" OR \"البورصة\" OR \"الأسهم العالمية\")",
    "GLOBAL",
    Category.MARKETS,
    93,
  ),
  arGNews(
    "AR_GN_GLOBAL_ECON",
    "Global Economy Arabic",
    "(اقتصاد OR تضخم OR \"أسعار الفائدة\" OR \"البنك المركزي\" OR ركود)",
    "GLOBAL",
    Category.ECONOMICS,
    92,
  ),
  arGNews(
    "AR_GN_GLOBAL_FX",
    "Global FX Arabic",
    "(دولار OR يورو OR \"سعر الصرف\" OR عملات OR فوركس)",
    "GLOBAL",
    Category.FX,
    88,
  ),
  arGNews(
    "AR_GN_GLOBAL_COMMOD",
    "Global Commodities Arabic",
    "(سلع OR نحاس OR فضة OR معادن OR \"السلع الأساسية\")",
    "GLOBAL",
    Category.COMMODITIES,
    86,
  ),

  // China desk (Arabic coverage)
  arGNews(
    "AR_GN_CN_ECON",
    "China Economy Arabic",
    "الصين (اقتصاد OR نمو OR \"الناتج المحلي\" OR تضخم OR \"البنك المركزي\")",
    "CN",
    Category.ECONOMICS,
    94,
  ),
  arGNews(
    "AR_GN_CN_TRADE",
    "China Trade Arabic",
    "الصين (تجارة OR صادرات OR واردات OR \"Belt and Road\" OR \"طريق الحرير\")",
    "CN",
    Category.TRADE,
    92,
  ),
  arGNews(
    "AR_GN_CN_GOLD",
    "China Gold Arabic",
    "الصين (ذهب OR معادن OR \"احتياطي الذهب\" OR \"بنك الصين\")",
    "CN",
    Category.GOLD,
    90,
  ),
  arGNews(
    "AR_GN_CN_OIL",
    "China Energy Arabic",
    "الصين (نفط OR غاز OR طاقة OR \"استيراد النفط\" OR LNG)",
    "CN",
    Category.OIL,
    90,
  ),
  arGNews(
    "AR_GN_CN_MARKETS",
    "China Markets Arabic",
    "الصين (بورصة OR أسهم OR \"شنغهاي\" OR \"هونغ كونغ\" OR \"سوق الأسهم\")",
    "CN",
    Category.MARKETS,
    91,
  ),
  arGNews(
    "AR_GN_CN_BANK",
    "China Banking Arabic",
    "الصين (بنك OR ائتمان OR \"الدين\" OR \"العقارات\" OR \"البنوك الصينية\")",
    "CN",
    Category.BANKING,
    88,
  ),
  arGNews(
    "AR_GN_TW_AR",
    "Taiwan Markets Arabic",
    "تايوان (اقتصاد OR أسواق OR رقائق OR \"TSMC\" OR تصدير)",
    "TW",
    Category.MARKETS,
    86,
  ),
  arGNews(
    "AR_GN_HK_AR",
    "Hong Kong Markets Arabic",
    "هونغ كونغ (بورصة OR أسواق OR مالية OR \"Hang Seng\")",
    "HK",
    Category.MARKETS,
    86,
  ),

  // Europe desk (Arabic coverage)
  arGNews(
    "AR_GN_EU_ECON",
    "Eurozone Economy Arabic",
    "أوروبا (اقتصاد OR يورو OR \"البنك المركزي الأوروبي\" OR ECB OR تضخم)",
    "EU",
    Category.ECONOMICS,
    94,
  ),
  arGNews(
    "AR_GN_EU_GOLD",
    "Europe Gold Arabic",
    "أوروبا (ذهب OR سبائك OR معادن OR \"أسعار الذهب\")",
    "EU",
    Category.GOLD,
    92,
  ),
  arGNews(
    "AR_GN_EU_OIL",
    "Europe Energy Arabic",
    "أوروبا (نفط OR غاز OR طاقة OR LNG OR \"أزمة الطاقة\")",
    "EU",
    Category.OIL,
    91,
  ),
  arGNews(
    "AR_GN_EU_MARKETS",
    "Europe Markets Arabic",
    "أوروبا (بورصة OR أسهم OR \"سوق الأسهم\" OR DAX OR CAC)",
    "EU",
    Category.MARKETS,
    90,
  ),
  arGNews(
    "AR_GN_DE_ECON",
    "Germany Economy Arabic",
    "ألمانيا (اقتصاد OR صناعة OR تصدير OR \"البنك المركزي\")",
    "DE",
    Category.ECONOMICS,
    88,
  ),
  arGNews(
    "AR_GN_FR_ECON",
    "France Economy Arabic",
    "فرنسا (اقتصاد OR أسواق OR \"البنك المركزي\" OR صناعة)",
    "FR",
    Category.ECONOMICS,
    86,
  ),
  arGNews(
    "AR_GN_GB_ECON",
    "UK Economy Arabic",
    "بريطانيا (اقتصاد OR \"بنك إنجلترا\" OR جنيه OR \"سوق الأسهم\")",
    "GB",
    Category.ECONOMICS,
    86,
  ),
  arGNews(
    "AR_GN_CH_ECON",
    "Switzerland Finance Arabic",
    "سويسرا (بنوك OR مالية OR \"البنك الوطني\" OR ذهب)",
    "CH",
    Category.FINANCE,
    84,
  ),
  arGNews(
    "AR_GN_EU_BANK",
    "Europe Banking Arabic",
    "أوروبا (بنك OR ائتمان OR \"أسعار الفائدة\" OR \"البنوك الأوروبية\")",
    "EU",
    Category.BANKING,
    88,
  ),

  // US/global markets in Arabic (feeds Arabic readers on global desk)
  arGNews(
    "AR_GN_US_MARKETS_AR",
    "US Markets Arabic",
    "أمريكا (أسواق OR \"وول ستريت\" OR \"سوق الأسهم\" OR \"الاحتياطي الفيدرالي\" OR Fed)",
    "US",
    Category.MARKETS,
    90,
  ),
  arGNews(
    "AR_GN_US_GOLD_AR",
    "US Gold Arabic",
    "أمريكا (ذهب OR سبائك OR \"الذهب\" OR COMEX)",
    "US",
    Category.GOLD,
    88,
  ),

  // GCC oil (Arabic, secondary to KW)
  arGNews(
    "AR_GN_SA_OIL",
    "Saudi Oil Arabic",
    "السعودية (نفط OR أرامكو OR غاز OR طاقة OR \"وزارة الطاقة\")",
    "SA",
    Category.OIL,
    88,
  ),
  arGNews(
    "AR_GN_AE_OIL",
    "UAE Oil Arabic",
    "الإمارات (نفط OR ADNOC OR طاقة OR غاز OR LNG)",
    "AE",
    Category.OIL,
    86,
  ),
] as const;

/** All sources for the dedicated Arabic collect pipeline. */
export function arabicLiveSources() {
  return [...ARABIC_NATIVE_PUBLISHERS, ...ARABIC_GOOGLE_NEWS_SOURCES];
}

export function isArabicCollectEnabled() {
  const flag = process.env.ARABIC_COLLECT_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") return false;
  return flag === "true" || flag === "1" || flag === "on" || Boolean(process.env.ARABIC_COLLECT_FORCE);
}
