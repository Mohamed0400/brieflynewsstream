import { COUNTRY_CATALOG } from "@/lib/countries";

export type MarketHubSlug =
  | "mena"
  | "gcc"
  | "europe"
  | "saudi-arabia"
  | "uae"
  | "kuwait"
  | "egypt"
  | "united-kingdom"
  | "germany"
  | "france";

export type MarketHub = {
  slug: MarketHubSlug;
  regionFilter?: string;
  countryCodes: string[];
  titleEn: string;
  titleAr: string;
  ledeEn: string;
  ledeAr: string;
  bodyEn: string;
  bodyAr: string;
  keywords: string[];
};

const byCode = new Map(COUNTRY_CATALOG.map((c) => [c.code, c]));

function names(codes: string[], lang: "en" | "ar") {
  return codes
    .map((code) => byCode.get(code))
    .filter(Boolean)
    .map((c) => (lang === "en" ? c!.country : c!.nameAr))
    .join(lang === "en" ? ", " : "، ");
}

/** SEO hub definitions - unique copy per hub (doorway-page safe). */
export const MARKET_HUBS: MarketHub[] = [
  {
    slug: "mena",
    regionFilter: "middle_east",
    countryCodes: ["SA", "AE", "EG", "JO", "LB", "IQ", "MA", "TN", "DZ", "QA", "BH", "OM", "KW"],
    titleEn: "MENA market news API coverage",
    titleAr: "تغطية واجهة أخبار أسواق الشرق الأوسط وشمال أفريقيا",
    ledeEn:
      "Structured bilingual market news across Middle East and North Africa markets, with impact scores products can rank on.",
    ledeAr:
      "أخبار أسواق منظمة ثنائية اللغة عبر أسواق الشرق الأوسط وشمال أفريقيا، مع درجات أثر يمكن للمنتجات الترتيب وفقها.",
    bodyEn:
      "MENA desks need more than a global headline dump. Briefly NewsStream returns country-tagged stories with Arabic and English fields plus market-impact scores for rates, oil, metals, and the dollar. Filter by ISO country codes or the middle_east region parameter to keep product feeds focused on regional desks.",
    bodyAr:
      "مكاتب الشرق الأوسط وشمال أفريقيا تحتاج أكثر من سيل عناوين عالمية. Briefly NewsStream يعيد أخباراً موسومة بالدولة مع حقول عربية وإنجليزية ودرجات أثر على الفائدة والنفط والمعادن والدولار. صفِّ بأكواد ISO أو بمعامل المنطقة middle_east لإبقاء موجز المنتج مركزاً على المكاتب الإقليمية.",
    keywords: ["MENA news API", "Middle East market news API", "North Africa news API"],
  },
  {
    slug: "gcc",
    countryCodes: ["SA", "AE", "QA", "BH", "OM", "KW"],
    titleEn: "GCC Gulf market news API coverage",
    titleAr: "تغطية واجهة أخبار أسواق دول الخليج",
    ledeEn:
      "Gulf Cooperation Council market coverage for products that need Saudi, UAE, Qatar, Bahrain, Oman, and Kuwait desk context.",
    ledeAr:
      "تغطية أسواق مجلس التعاون الخليجي للمنتجات التي تحتاج سياق مكاتب السعودية والإمارات وقطر والبحرين وعمان والكويت.",
    bodyEn:
      "GCC markets move on energy, policy, and regional capital flows. Use Briefly to pull scored market stories filtered to Gulf ISO codes. Every story keeps bilingual fields so Arabic-first and English-first products share one endpoint.",
    bodyAr:
      "أسواق الخليج تتحرك مع الطاقة والسياسات وتدفقات رأس المال. استخدم Briefly لاسترجاع أخبار أسواق بدرجة أثر ومصفّاة بأكواد دول الخليج. كل خبر يحتفظ بحقول ثنائية اللغة حتى تشارك المنتجات العربية والإنجليزية نفس نقطة النهاية.",
    keywords: ["GCC news API", "Gulf news API", "Saudi UAE news API"],
  },
  {
    slug: "europe",
    countryCodes: ["GB", "DE", "FR", "NL", "IT", "ES", "TR"],
    titleEn: "Europe market news API coverage",
    titleAr: "تغطية واجهة أخبار أسواق أوروبا",
    ledeEn:
      "European market news with the same impact-scored schema used for MENA and Gulf desks.",
    ledeAr:
      "أخبار أسواق أوروبية بنفس مخطط درجات الأثر المستخدم لمكاتب الشرق الأوسط والخليج.",
    bodyEn:
      "Expand beyond US-centric feeds with UK, Germany, France, Netherlands, Italy, Spain, and Turkey country filters. Briefly keeps one JSON shape across regions so your product does not maintain separate parsers for Europe and MENA.",
    bodyAr:
      "وسّع خارج الموجزات المركزة على أمريكا بفلاتر المملكة المتحدة وألمانيا وفرنسا وهولندا وإيطاليا وإسبانيا وتركيا. Briefly يبقي شكلاً واحداً من JSON عبر المناطق حتى لا تحتاج منتجاتك محلّلات منفصلة لأوروبا والشرق الأوسط.",
    keywords: ["Europe news API", "European market news API", "UK Germany France news API"],
  },
  {
    slug: "saudi-arabia",
    countryCodes: ["SA"],
    titleEn: "Saudi Arabia market news API",
    titleAr: "واجهة أخبار أسواق السعودية",
    ledeEn: "Country-filtered market intelligence for Saudi desks and products.",
    ledeAr: "ذكاء أسواق مصفّى للدولة لمكاتب ومنتجات السعودية.",
    bodyEn:
      "Request country=SA to retrieve Saudi-tagged market stories with impact scores and bilingual fields. Use the live 72-hour window for briefings or archive bounds for research products.",
    bodyAr:
      "اطلب country=SA لاسترجاع أخبار أسواق موسومة بالسعودية مع درجات أثر وحقول ثنائية اللغة. استخدم نافذة 72 ساعة للموجزات أو حدود الأرشيف لمنتجات البحث.",
    keywords: ["Saudi news API", "Saudi Arabia market news API"],
  },
  {
    slug: "uae",
    countryCodes: ["AE"],
    titleEn: "UAE market news API",
    titleAr: "واجهة أخبار أسواق الإمارات",
    ledeEn: "United Arab Emirates market stories in a product-ready JSON schema.",
    ledeAr: "أخبار أسواق الإمارات في مخطط JSON جاهز للمنتجات.",
    bodyEn:
      "Filter with country=AE for UAE market coverage. Rank by impact when newest-first is not enough for trading or media products.",
    bodyAr:
      "صفِّ بـ country=AE لتغطية أسواق الإمارات. رتّب حسب الأثر عندما لا يكفي الأحدث أولاً لمنتجات التداول أو الإعلام.",
    keywords: ["UAE news API", "Dubai Abu Dhabi market news API"],
  },
  {
    slug: "kuwait",
    countryCodes: ["KW"],
    titleEn: "Kuwait market news API",
    titleAr: "واجهة أخبار أسواق الكويت",
    ledeEn: "Country-filtered Gulf market intelligence with bilingual fields and impact scores.",
    ledeAr: "ذكاء أسواق خليجي مصفّى للدولة مع حقول ثنائية اللغة ودرجات أثر.",
    bodyEn:
      "Request country=KW for Kuwait-tagged market stories covering rates, oil, banking, and regional capital flows. Arabic and English fields ship on every record so Arabic-first products do not need a second translation layer.",
    bodyAr:
      "اطلب country=KW لأخبار أسواق موسومة بالكويت تغطي الفائدة والنفط والمصارف وتدفقات رأس المال الإقليمية. حقول عربية وإنجليزية في كل سجل حتى لا تحتاج المنتجات العربية أولاً طبقة ترجمة ثانية.",
    keywords: ["Kuwait news API", "Kuwait market news API", "Gulf market news API"],
  },
  {
    slug: "egypt",
    countryCodes: ["EG"],
    titleEn: "Egypt market news API",
    titleAr: "واجهة أخبار أسواق مصر",
    ledeEn: "Egypt-tagged market news with Arabic-default bilingual fields.",
    ledeAr: "أخبار أسواق موسومة بمصر مع حقول ثنائية اللغة والعربية افتراضياً.",
    bodyEn:
      "Egypt is a core MENA desk in the catalog. Use country=EG with sort=score to surface higher-impact market stories for local and regional products.",
    bodyAr:
      "مصر مكتب أساسي في كتالوج الشرق الأوسط وشمال أفريقيا. استخدم country=EG مع sort=score لإبراز أخبار أعلى أثراً للمنتجات المحلية والإقليمية.",
    keywords: ["Egypt news API", "Egyptian market news API"],
  },
  {
    slug: "united-kingdom",
    countryCodes: ["GB"],
    titleEn: "United Kingdom market news API",
    titleAr: "واجهة أخبار أسواق المملكة المتحدة",
    ledeEn: "UK market coverage inside the same bilingual impact-scored API.",
    ledeAr: "تغطية أسواق المملكة المتحدة داخل نفس واجهة درجات الأثر الثنائية اللغة.",
    bodyEn:
      "European and global products can filter country=GB without leaving the Briefly schema. Pair with category filters such as finance, oil, or markets.",
    bodyAr:
      "يمكن لمنتجات أوروبا والعالم التصفية بـ country=GB دون مغادرة مخطط Briefly. اجمعها مع فلاتر الفئة مثل finance أو oil أو markets.",
    keywords: ["UK news API", "Britain market news API"],
  },
  {
    slug: "germany",
    countryCodes: ["DE"],
    titleEn: "Germany market news API",
    titleAr: "واجهة أخبار أسواق ألمانيا",
    ledeEn: "Germany-tagged market stories for European product feeds.",
    ledeAr: "أخبار أسواق موسومة بألمانيا لموجزات المنتجات الأوروبية.",
    bodyEn:
      "Use country=DE when your product needs German market context alongside MENA or Gulf coverage in one integration.",
    bodyAr:
      "استخدم country=DE عندما يحتاج منتجك سياق أسواق ألمانيا إلى جانب تغطية الشرق الأوسط أو الخليج في تكامل واحد.",
    keywords: ["Germany news API", "German market news API"],
  },
  {
    slug: "france",
    countryCodes: ["FR"],
    titleEn: "France market news API",
    titleAr: "واجهة أخبار أسواق فرنسا",
    ledeEn: "France market coverage with impact scores and bilingual response fields.",
    ledeAr: "تغطية أسواق فرنسا بدرجات أثر وحقول استجابة ثنائية اللغة.",
    bodyEn:
      "Filter country=FR to keep French market stories in the same ranked feed as Gulf and MENA desks.",
    bodyAr:
      "صفِّ بـ country=FR لإبقاء أخبار أسواق فرنسا في نفس الموجز المرتّب مع مكاتب الخليج والشرق الأوسط.",
    keywords: ["France news API", "French market news API"],
  },
];

export function marketHubBySlug(slug: string): MarketHub | undefined {
  return MARKET_HUBS.find((hub) => hub.slug === slug);
}

export function marketHubCountryLabel(hub: MarketHub, lang: "en" | "ar") {
  return names(hub.countryCodes, lang);
}

export const MARKET_HUB_SLUGS = MARKET_HUBS.map((h) => h.slug);
