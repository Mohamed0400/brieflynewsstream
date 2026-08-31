import { Category, Region } from "@prisma/client";
import { regionForCountry } from "../classify";
import { catalogCountryCodes, countryRecord } from "../countries";
import { googleNewsRssUrl } from "../country-sources";
import type { CountrySourceSeed } from "./types";
import { arabicGoogleNewsRss } from "./types";

const SPECIAL_NAME_AR: Record<string, { label: string; nameAr: string }> = {
  GLOBAL: { label: "Global", nameAr: "" },
  EU: { label: "Eurozone", nameAr: "أوروبا" },
};

type TopicDef = {
  suffix: string;
  label: string;
  terms: string;
  category: Category;
  baseWeight: number;
};

function qCountry(nameAr: string, terms: string) {
  return nameAr ? `${nameAr} (${terms})` : `(${terms})`;
}

/** Full investor-desk topic set including crypto / blockchain. */
const TOPICS_FULL: TopicDef[] = [
  { suffix: "GOLD", label: "Gold", terms: "ذهب OR سبائك OR \"أسعار الذهب\" OR XAU OR \"المعدن الأصفر\"", category: Category.GOLD, baseWeight: 94 },
  { suffix: "OIL", label: "Oil", terms: "نفط OR بترول OR غاز OR OPEC OR \"خام برنت\" OR LNG", category: Category.OIL, baseWeight: 92 },
  { suffix: "ENERGY", label: "Energy", terms: "طاقة OR كهرباء OR \"محطات الطاقة\" OR وقود OR \"طاقة متجددة\"", category: Category.ENERGY, baseWeight: 90 },
  { suffix: "MARKETS", label: "Markets", terms: "أسواق OR \"سوق الأسهم\" OR بورصة OR أسهم OR \"سوق المال\"", category: Category.MARKETS, baseWeight: 91 },
  { suffix: "ECON", label: "Economy", terms: "اقتصاد OR \"الناتج المحلي\" OR تضخم OR \"أسعار الفائدة\" OR ركود", category: Category.ECONOMICS, baseWeight: 90 },
  { suffix: "BANK", label: "Banking", terms: "بنك OR \"بنك مركزي\" OR ائتمان OR قروض OR \"القطاع المصرفي\"", category: Category.BANKING, baseWeight: 88 },
  { suffix: "TRADE", label: "Trade", terms: "تجارة OR صادرات OR واردات OR \"الميزان التجاري\" OR tariff", category: Category.TRADE, baseWeight: 86 },
  { suffix: "FX", label: "Currency", terms: "عملة OR \"سعر الصرف\" OR دولار OR يورو OR فوركس", category: Category.FX, baseWeight: 84 },
  { suffix: "FINANCE", label: "Finance", terms: "مالية OR استثمار OR \"صناديق\" OR \"أسواق المال\" OR IPO", category: Category.FINANCE, baseWeight: 87 },
  { suffix: "COMMOD", label: "Commodities", terms: "سلع OR نحاس OR فضة OR معادن OR \"السلع الأساسية\"", category: Category.COMMODITIES, baseWeight: 85 },
  { suffix: "CRYPTO", label: "Crypto", terms: "bitcoin OR \"بيتكوين\" OR ethereum OR \"إيثريوم\" OR \"عملات رقمية\" OR crypto", category: Category.CRYPTO, baseWeight: 88 },
  { suffix: "BLOCKCHAIN", label: "Blockchain", terms: "blockchain OR \"بلوك تشين\" OR \"سلسلة الكتل\" OR DeFi OR \"التمويل اللامركزي\" OR Web3", category: Category.CRYPTO, baseWeight: 86 },
  { suffix: "MEECON", label: "Regional Economy", terms: "اقتصاد OR أعمال OR \"السوق المحلي\" OR \"سياسة مالية\"", category: Category.ME_ECONOMY, baseWeight: 84 },
  { suffix: "PROPERTY", label: "Property", terms: "عقارات OR \"سوق العقارات\" OR إسكان OR mortgage OR \"الأسعار العقارية\"", category: Category.REAL_ESTATE, baseWeight: 80 },
  { suffix: "INSURE", label: "Insurance", terms: "تأمين OR \"شركات التأمين\" OR \"قطاع التأمين\"", category: Category.INSURANCE, baseWeight: 78 },
  { suffix: "SHIP", label: "Shipping", terms: "شحن OR \"النقل البحري\" OR \"موانئ\" OR logistics OR \"سلسلة الإمداد\"", category: Category.SHIPPING, baseWeight: 78 },
];

const TOPICS_DESK = TOPICS_FULL.filter((topic) => !["PROPERTY", "INSURE", "SHIP", "MEECON"].includes(topic.suffix));

const TOPICS_CORE: TopicDef[] = [
  TOPICS_FULL.find((t) => t.suffix === "ECON")!,
  TOPICS_FULL.find((t) => t.suffix === "MARKETS")!,
  TOPICS_FULL.find((t) => t.suffix === "BANK")!,
  TOPICS_FULL.find((t) => t.suffix === "OIL")!,
  TOPICS_FULL.find((t) => t.suffix === "GOLD")!,
  TOPICS_FULL.find((t) => t.suffix === "CRYPTO")!,
  TOPICS_FULL.find((t) => t.suffix === "BLOCKCHAIN")!,
];

const TOPICS_GCC = TOPICS_DESK.filter((t) => t.suffix !== "SHIP");

type HandFeed = {
  code: string;
  name: string;
  query: string;
  country: string;
  category: Category;
  weight: number;
};

/** Extra high-signal queries not covered by the generic matrix. */
const HAND_FEEDS: HandFeed[] = [
  // Kuwait focused
  { code: "AR_GN_KW_KOC", name: "Kuwait KOC Arabic", query: "الكويت (KOC OR \"شركة نفط الكويت\" OR \"Kuwait Oil Company\")", country: "KW", category: Category.OIL, weight: 98 },
  { code: "AR_GN_KW_KPC", name: "Kuwait KPC Arabic", query: "الكويت (KPC OR \"Kuwait Petroleum\" OR \"البترول الكويتية\")", country: "KW", category: Category.OIL, weight: 98 },
  { code: "AR_GN_KW_BOURSA", name: "Kuwait Bourse Arabic", query: "الكويت (\"بورصة الكويت\" OR Boursa OR \"سوق الكويت\")", country: "KW", category: Category.MARKETS, weight: 96 },
  { code: "AR_GN_KW_KIA", name: "Kuwait KIA Arabic", query: "الكويت (KIA OR \"الهيئة العامة للاستثمار\" OR \"صندوق سيادي\")", country: "KW", category: Category.FINANCE, weight: 95 },
  { code: "AR_GN_KW_CBK", name: "Kuwait CBK Arabic", query: "الكويت (\"البنك المركزي الكويتي\" OR CBK OR \"سياسة نقدية\")", country: "KW", category: Category.BANKING, weight: 94 },
  { code: "AR_GN_KW_BTC", name: "Kuwait Bitcoin Arabic", query: "الكويت (\"بيتكوين\" OR bitcoin OR \"عملات رقمية\" OR crypto)", country: "KW", category: Category.CRYPTO, weight: 90 },
  { code: "AR_GN_KW_SOLAR", name: "Kuwait Renewables Arabic", query: "الكويت (\"طاقة شمسية\" OR \"طاقة متجددة\" OR \"الطاقة الشمسية\" OR electricity)", country: "KW", category: Category.ENERGY, weight: 88 },
  // Global desk
  { code: "AR_GN_GL_OPEC", name: "Global OPEC Arabic", query: "(OPEC OR \"أوبك\" OR \"أوبك+\" OR \"إمدادات النفط\")", country: "GLOBAL", category: Category.OIL, weight: 96 },
  { code: "AR_GN_GL_FED", name: "Global Fed Arabic", query: "(Fed OR \"الفيدرالي\" OR \"الاحتياطي الفيدرالي\" OR \"أسعار الفائدة\" OR FOMC)", country: "GLOBAL", category: Category.ECONOMICS, weight: 95 },
  { code: "AR_GN_GL_ECB", name: "Global ECB Arabic", query: "(ECB OR \"البنك المركزي الأوروبي\" OR \"سعر الفائدة\" OR euro)", country: "GLOBAL", category: Category.ECONOMICS, weight: 94 },
  { code: "AR_GN_GL_BTC", name: "Global Bitcoin Arabic", query: "(bitcoin OR \"بيتكوين\" OR BTC OR \"سعر البitcoin\")", country: "GLOBAL", category: Category.CRYPTO, weight: 93 },
  { code: "AR_GN_GL_ETH", name: "Global Ethereum Arabic", query: "(ethereum OR \"إيثريوم\" OR ETH OR \"الإيثيريوم\")", country: "GLOBAL", category: Category.CRYPTO, weight: 91 },
  { code: "AR_GN_GL_DEFI", name: "Global DeFi Arabic", query: "(DeFi OR \"التمويل اللامركزي\" OR \"عملات رقمية\" OR stablecoin)", country: "GLOBAL", category: Category.CRYPTO, weight: 89 },
  { code: "AR_GN_GL_WGC", name: "Global Gold Council Arabic", query: "(\"World Gold Council\" OR \"المجلس العالمي للذهب\" OR \"احتياطي الذهب\")", country: "GLOBAL", category: Category.GOLD, weight: 94 },
  { code: "AR_GN_GL_BRENT", name: "Global Brent Arabic", query: "(Brent OR \"برنت\" OR \"أسعار النفط\" OR WTI OR crude)", country: "GLOBAL", category: Category.OIL, weight: 93 },
  // China / Europe anchors
  { code: "AR_GN_CN_BRI", name: "China Belt Road Arabic", query: "الصين (\"Belt and Road\" OR \"طريق الحرير\" OR \"مبادرة الحزام والطريق\")", country: "CN", category: Category.TRADE, weight: 92 },
  { code: "AR_GN_CN_PBOC", name: "China PBOC Arabic", query: "الصين (\"بنك الصين\" OR PBOC OR \"البنك المركزي الصيني\")", country: "CN", category: Category.BANKING, weight: 91 },
  { code: "AR_GN_CN_TSMC", name: "Taiwan TSMC Arabic", query: "تايوان (TSMC OR \"رقائق\" OR semiconductors OR \"الصناعات الدقيقة\")", country: "TW", category: Category.MARKETS, weight: 90 },
  { code: "AR_GN_EU_ECB2", name: "Eurozone ECB Rates Arabic", query: "أوروبا (ECB OR \"البنك المركزي الأوروبي\" OR \"رفع الفائدة\" OR \"تشديد نقدي\")", country: "EU", category: Category.ECONOMICS, weight: 93 },
  { code: "AR_GN_EU_GAS", name: "Europe Gas Crisis Arabic", query: "أوروبا (غاز OR \"أزمة الطاقة\" OR LNG OR \"تخزين الغاز\" OR Nord Stream)", country: "EU", category: Category.ENERGY, weight: 91 },
];

const CHINA_DESK = ["CN", "TW", "HK"] as const;
const GCC_DESK = ["SA", "AE", "QA", "BH", "OM"] as const;
const US_DESK = ["US"] as const;
const EUROPE_DESK = [
  "EU", "GB", "DE", "FR", "CH", "NL", "IT", "ES", "BE", "AT", "SE", "NO", "DK",
  "PL", "UA", "RU", "PT", "IE", "FI", "GR", "CZ", "RO", "HU", "SK", "HR",
  "RS", "BG", "IS",
] as const;

const PRIORITY_COUNTRIES = new Set([
  "KW", "GLOBAL", "EU",
  ...CHINA_DESK,
  ...EUROPE_DESK,
  ...GCC_DESK,
  ...US_DESK,
]);

function deskMeta(countryCode: string) {
  const code = countryCode.trim().toUpperCase();
  const special = SPECIAL_NAME_AR[code];
  if (special) {
    return {
      code,
      label: special.label,
      nameAr: special.nameAr,
    };
  }
  const record = countryRecord(code);
  return {
    code,
    label: record?.country ?? code,
    nameAr: record?.nameAr ?? code,
  };
}

function buildGNews(
  code: string,
  name: string,
  query: string,
  country: string,
  category: Category,
  qualityWeight: number,
): CountrySourceSeed {
  const region = regionForCountry(country, Region.GLOBAL);
  return arabicGoogleNewsRss(
    code,
    name,
    query,
    "https://news.google.com/",
    country,
    region,
    category,
    qualityWeight,
    googleNewsRssUrl(query, "ar"),
  );
}

function generateMatrix(
  countryCode: string,
  topics: TopicDef[],
  weightBoost: number,
): CountrySourceSeed[] {
  const { code, label, nameAr } = deskMeta(countryCode);
  return topics.map((topic) => {
    const query = qCountry(nameAr, topic.terms);
    return buildGNews(
      `AR_GN_${code}_${topic.suffix}`,
      `${label} ${topic.label} Arabic`,
      query,
      code,
      topic.category,
      Math.min(99, Math.max(72, topic.baseWeight + weightBoost)),
    );
  });
}

/** Programmatic Arabic Google News matrix — 700+ quality feeds. */
export function generatedArabicGoogleSources(): CountrySourceSeed[] {
  const out: CountrySourceSeed[] = [];
  const usedCodes = new Set<string>();
  const usedUrls = new Set<string>();

  const push = (source: CountrySourceSeed) => {
    if (usedCodes.has(source.code) || usedUrls.has(source.url)) return;
    usedCodes.add(source.code);
    usedUrls.add(source.url);
    out.push(source);
  };

  for (const feed of HAND_FEEDS) {
    push(buildGNews(feed.code, feed.name, feed.query, feed.country, feed.category, feed.weight));
  }

  for (const source of generateMatrix("KW", TOPICS_FULL, 5)) push(source);
  for (const source of generateMatrix("GLOBAL", TOPICS_FULL, 4)) push(source);

  for (const code of CHINA_DESK) {
    for (const source of generateMatrix(code, TOPICS_DESK, 3)) push(source);
  }
  for (const code of EUROPE_DESK) {
    const boost = ["EU", "DE", "FR", "GB", "CH", "NL"].includes(code) ? 2 : 1;
    for (const source of generateMatrix(code, TOPICS_DESK, boost)) push(source);
  }
  for (const code of US_DESK) {
    for (const source of generateMatrix(code, TOPICS_DESK, 2)) push(source);
  }
  for (const code of GCC_DESK) {
    for (const source of generateMatrix(code, TOPICS_GCC, 2)) push(source);
  }

  for (const code of catalogCountryCodes()) {
    if (PRIORITY_COUNTRIES.has(code)) continue;
    for (const source of generateMatrix(code, TOPICS_CORE, 0)) push(source);
  }

  return out;
}
