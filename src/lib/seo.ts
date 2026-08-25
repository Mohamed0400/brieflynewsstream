import type { Metadata } from "next";
import { mediaAbsoluteUrl, mediaUrl } from "@/lib/media";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { publicSiteUrl } from "@/lib/site-url";

export type SeoLang = "ar" | "en";

export const SITE_NAME = "Briefly NewsStream";
export const SITE_NAME_AR = "Briefly NewsStream";
export const PRODUCT_LINE_AR = "واجهة ذكاء أسواق";
export const PRODUCT_LINE_EN = "Market Intelligence API";

export function siteTitle(lang: SeoLang, page?: string) {
  const line = lang === "en" ? PRODUCT_LINE_EN : PRODUCT_LINE_AR;
  if (!page) return `${SITE_NAME} | ${line}`;
  return `${page} | ${line}`;
}

/** Default Open Graph / Twitter share card (1200x630) via Cloudinary. */
export const OG_IMAGE_PATH = mediaUrl("ogShare", {
  width: 1200,
  height: 630,
  crop: "fill",
  quality: "auto",
});
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_SHARE_TAGLINE =
  "Market intelligence API with impact scores and bilingual fields, ready for products.";
export const OG_SHARE_TAGLINE_AR =
  "واجهة ذكاء أسواق بدرجات أثر وحقول ثنائية اللغة، جاهزة للمنتجات.";

/** Square brand mark on a light ground. Google shows this beside the site name. */
export function brandLogoUrl() {
  return absoluteUrl("/favicon-192x192.png");
}

export function brandWordmarkUrl() {
  return absoluteUrl("/brand/logo-wordmark.png");
}

export function brandLogoJsonLd() {
  return {
    "@type": "ImageObject",
    url: brandLogoUrl(),
    contentUrl: brandLogoUrl(),
    width: 192,
    height: 192,
    caption: SITE_NAME,
  };
}

export function ogShareAbsoluteUrl() {
  return mediaAbsoluteUrl("ogShare", {
    width: 1200,
    height: 630,
    crop: "fill",
    quality: "auto",
  });
}

/** Regional geo for search engines. No single-country product identity. */
export const GEO_PRIMARY = {
  region: "Middle East",
  regionAr: "الشرق الأوسط",
} as const;

/** Countries / markets we explicitly target in SEO + AEO (ISO 3166-1 alpha-2). */
export const GEO_TARGET_COUNTRIES = [
  { code: "SA", en: "Saudi Arabia", ar: "السعودية" },
  { code: "AE", en: "United Arab Emirates", ar: "الإمارات" },
  { code: "QA", en: "Qatar", ar: "قطر" },
  { code: "BH", en: "Bahrain", ar: "البحرين" },
  { code: "OM", en: "Oman", ar: "عمان" },
  { code: "KW", en: "Kuwait", ar: "الكويت" },
  { code: "EG", en: "Egypt", ar: "مصر" },
  { code: "JO", en: "Jordan", ar: "الأردن" },
  { code: "LB", en: "Lebanon", ar: "لبنان" },
  { code: "IQ", en: "Iraq", ar: "العراق" },
  { code: "SY", en: "Syria", ar: "سوريا" },
  { code: "YE", en: "Yemen", ar: "اليمن" },
  { code: "PS", en: "Palestine", ar: "فلسطين" },
  { code: "SD", en: "Sudan", ar: "السودان" },
  { code: "MA", en: "Morocco", ar: "المغرب" },
  { code: "TN", en: "Tunisia", ar: "تونس" },
  { code: "DZ", en: "Algeria", ar: "الجزائر" },
  { code: "LY", en: "Libya", ar: "ليبيا" },
  { code: "MR", en: "Mauritania", ar: "موريتانيا" },
  { code: "GB", en: "United Kingdom", ar: "المملكة المتحدة" },
  { code: "DE", en: "Germany", ar: "ألمانيا" },
  { code: "FR", en: "France", ar: "فرنسا" },
  { code: "NL", en: "Netherlands", ar: "هولندا" },
  { code: "IT", en: "Italy", ar: "إيطاليا" },
  { code: "ES", en: "Spain", ar: "إسبانيا" },
  { code: "TR", en: "Turkey", ar: "تركيا" },
  { code: "US", en: "United States", ar: "الولايات المتحدة" },
] as const;

export const GEO_AREA_SERVED = [
  "Worldwide",
  "Middle East",
  "Gulf Cooperation Council",
  "MENA",
  "Europe",
  "Arabic-speaking countries",
  ...GEO_TARGET_COUNTRIES.map((c) => c.en),
] as const;

/** Primary brand + competitor-style queries (EN). Used in meta keywords + strategy docs. */
export const SEO_KEYWORDS_EN = [
  "Briefly NewsStream",
  "news API",
  "newsapi",
  "JSON news API",
  "REST news API",
  "realtime news API",
  "real-time news API",
  "market intelligence API",
  "market briefing API",
  "breaking news API",
  "headlines API",
  "news data API",
  "media news API",
  "worldwide news API",
  "global news API",
  "international news API",
  "European news API",
  "Europe market news API",
  "UK news API",
  "Germany news API",
  "France news API",
  "market news API",
  "financial news API",
  "business news API",
  "commodities news API",
  "stock market news API",
  "Arabic news API",
  "bilingual news API",
  "Arabic English news API",
  "Middle East news API",
  "Gulf news API",
  "MENA news API",
  "GCC news API",
  "Arabic speaking countries news API",
  "Saudi news API",
  "UAE news API",
  "Qatar news API",
  "Bahrain news API",
  "Oman news API",
  "Egypt news API",
  "Jordan news API",
  "Lebanon news API",
  "Iraq news API",
  "Morocco news API",
  "developer news API",
  "news API for developers",
  "news API pricing",
  "free news API",
  "news API key",
  "impact scoring news",
  "community briefings API",
] as const;

/** Arabic / bilingual discovery terms including Middle East and Arabic-speaking markets. */
export const SEO_KEYWORDS_AR = [
  "Briefly NewsStream",
  "واجهة ذكاء أسواق",
  "واجهة برمجة أخبار",
  "API أخبار",
  "أخبار الأسواق",
  "أخبار مالية API",
  "أخبار عربية إنجليزية",
  "واجهة أخبار ثنائية اللغة",
  "أخبار الشرق الأوسط",
  "أخبار الخليج",
  "أخبار أوروبا",
  "أخبار الدول العربية",
  "أخبار السعودية",
  "أخبار الإمارات",
  "أخبار قطر",
  "أخبار البحرين",
  "أخبار عمان",
  "أخبار مصر",
  "أخبار الأردن",
  "أخبار لبنان",
  "أخبار العراق",
  "أخبار المغرب",
  "موجز الأسواق",
  "API للمطورين",
  "مفتاح API أخبار",
] as const;

/** Answer-first descriptions for SEO + AI Overviews / AEO. */
export const SEO_DESCRIPTION_EN =
  "Briefly NewsStream is a market intelligence API: Arabic and English fields, impact scores, and 100+ countries in one API for products across MENA, the Gulf, Europe, and global markets.";

export const SEO_DESCRIPTION_AR =
  "Briefly NewsStream واجهة ذكاء أسواق: حقول عربية وإنجليزية، درجات أثر، وأكثر من ١٠٠ دولة في واجهة واحدة للمنتجات عبر الشرق الأوسط والخليج وأوروبا والأسواق العالمية.";

/** Short direct answers AI systems can cite (also used in FAQ / speakable). */
export const AEO_ENTITY_ANSWER_EN =
  "Briefly NewsStream is a market intelligence API with Arabic and English fields and impact scoring for products that need to know which news matters to markets.";

export const AEO_ENTITY_ANSWER_AR =
  "Briefly NewsStream واجهة ذكاء أسواق بحقول عربية وإنجليزية ودرجات أثر للمنتجات التي تحتاج أن تعرف أي خبر يهم الأسواق.";

export function absoluteUrl(path = "/") {
  const origin = publicSiteUrl();
  if (!path || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function hreflangAlternates(arabicPath: string, englishPath: string) {
  return {
    canonical: arabicPath,
    languages: {
      ar: arabicPath,
      en: englishPath,
      "x-default": arabicPath,
    },
  };
}

export function ogImages(alt = SITE_NAME) {
  return [
    {
      url: ogShareAbsoluteUrl(),
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt,
      type: "image/jpeg",
    },
  ];
}

/** Geo + language meta for search engines and AI crawlers. */
export function geoMetaTags(): Record<string, string> {
  return {
    "geo.placename": "Middle East, Gulf Cooperation Council, MENA, Europe",
    "content-language": "ar,en",
    "DC.language": "ar,en",
    audience:
      "developers, fintech, media, Middle East, Gulf, Europe, Arabic-speaking markets",
  };
}

export function pageMetadata(input: {
  lang: SeoLang;
  title: string;
  description: string;
  path: string;
  pathEn: string;
  keywords?: string[];
  ogType?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const isEn = input.lang === "en";
  const canonical = isEn ? input.pathEn : input.path;
  const keywords = [
    ...(input.keywords || []),
    ...(isEn ? SEO_KEYWORDS_EN : SEO_KEYWORDS_AR),
  ].slice(0, 48);
  const images = ogImages(input.title);

  return {
    title: {
      absolute: input.title.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`,
    },
    description: input.description.slice(0, 160),
    keywords: [...new Set(keywords)],
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: absoluteUrl("/") }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "Technology",
    robots: input.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    alternates: {
      canonical,
      languages: {
        ar: input.path,
        en: input.pathEn,
        "x-default": input.path,
      },
    },
    openGraph: {
      type: input.ogType || "website",
      locale: isEn ? "en_US" : "ar_SA",
      alternateLocale: isEn
        ? ["ar_SA", "ar_AE", "ar_EG"]
        : ["en_US", "ar_SA", "ar_AE", "ar_EG"],
      url: canonical,
      siteName: SITE_NAME,
      title: input.title,
      description: input.description.slice(0, 200),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description.slice(0, 200),
      images: [ogShareAbsoluteUrl()],
    },
    other: geoMetaTags(),
  };
}

function areaServedSchema() {
  return [
    { "@type": "Place", name: "Worldwide" },
    { "@type": "Place", name: "Middle East" },
    { "@type": "Place", name: "Gulf Cooperation Council" },
    { "@type": "Place", name: "MENA" },
    { "@type": "Place", name: "Europe" },
    { "@type": "AdministrativeArea", name: "Arabic-speaking countries" },
    ...GEO_TARGET_COUNTRIES.map((c) => ({
      "@type": "Country",
      name: c.en,
      alternateName: c.ar,
    })),
  ];
}

export function organizationJsonLd() {
  const url = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: ["Briefly News Stream", "NewsStream API", "موجز الأسواق", PRODUCT_LINE_AR, PRODUCT_LINE_EN],
    url,
    logo: brandLogoJsonLd(),
    image: [brandWordmarkUrl(), ogShareAbsoluteUrl()],
    description: AEO_ENTITY_ANSWER_EN,
    knowsAbout: [
      "Market news API",
      "Arabic news",
      "Bilingual news",
      "Middle East",
      "MENA",
      "GCC",
      "Arabic-speaking countries",
      "Impact scoring",
    ],
    areaServed: areaServedSchema(),
    availableLanguage: ["Arabic", "English"],
    sameAs: [],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: "hello@brieflynewsstream.com",
        availableLanguage: ["English", "Arabic"],
        areaServed: [...GEO_AREA_SERVED],
      },
    ],
  };
}

export function websiteJsonLd() {
  const url = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["Briefly News Stream", "NewsStream API", "موجز الأسواق", PRODUCT_LINE_AR, PRODUCT_LINE_EN],
    url,
    inLanguage: ["ar", "en"],
    description: AEO_ENTITY_ANSWER_AR,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url,
      logo: brandLogoJsonLd(),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/news")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** WebPage + Speakable for Google AI Overviews / voice / answer engines. */
export function webPageJsonLd(input: {
  lang: SeoLang;
  name: string;
  description: string;
  path: string;
  speakableCssSelectors?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: input.lang === "en" ? "en" : "ar",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
    about: {
      "@type": "Thing",
      name: SITE_NAME,
      description: input.lang === "en" ? AEO_ENTITY_ANSWER_EN : AEO_ENTITY_ANSWER_AR,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: input.speakableCssSelectors || [
        ".mkt-hero-copy h1",
        ".mkt-hero-copy p",
        ".mkt-faq-item",
        "[data-aeo-answer]",
      ],
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: ogShareAbsoluteUrl(),
    },
  };
}

export function softwareApplicationJsonLd(lang: SeoLang) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: lang === "en" ? PRODUCT_LINE_EN : PRODUCT_LINE_AR,
    operatingSystem: "Web",
    url: absoluteUrl("/"),
    description: lang === "en" ? SEO_DESCRIPTION_EN : SEO_DESCRIPTION_AR,
    inLanguage: ["ar", "en"],
    audience: {
      "@type": "Audience",
      audienceType: "Developers, fintech teams, media desks in the Middle East and Arabic-speaking countries",
      geographicArea: areaServedSchema(),
    },
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "Evaluate the bilingual market news API with daily request limits.",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: String(PLAN_DEFINITIONS.PRO.listPriceMonthlyUsd),
        priceCurrency: "USD",
        description: "Production daily limits, full filters, and commercial use. Request from Billing.",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Enterprise",
        price: String(PLAN_DEFINITIONS.ENTERPRISE.listPriceMonthlyUsd),
        priceCurrency: "USD",
        description: "Higher daily limits, more keys, priority support, and a published SLA. Request from Billing.",
        availability: "https://schema.org/InStock",
      },
    ],
    featureList: [
      "Arabic-first bilingual AR+EN news API",
      "Middle East and Gulf market coverage",
      "Europe and global country filters",
      "Arabic-speaking countries filters",
      "Market-impact scoring",
      "Community briefings",
      "Coverage across 100+ countries",
      "Developer console with API keys and explorer",
      "Permanent article archive",
    ],
    keywords: SEO_KEYWORDS_EN.slice(0, 30).join(", "),
  };
}

/** HowTo helps AI Overviews answer “how do I get a news API key?” */
export function howToGetApiKeyJsonLd(lang: SeoLang) {
  const isEn = lang === "en";
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: isEn
      ? "How to get a Briefly NewsStream API key"
      : "كيف تحصل على مفتاح API من Briefly NewsStream",
    description: isEn
      ? "Create a free console account and generate an API key for bilingual market news from the Middle East and Arabic-speaking markets."
      : "أنشئ حساباً مجانياً في اللوحة وأصدِر مفتاح API لأخبار الأسواق ثنائية اللغة من الشرق الأوسط والدول الناطقة بالعربية.",
    totalTime: "PT5M",
    inLanguage: isEn ? "en" : "ar",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: isEn ? "Open the developer console" : "افتح لوحة المطوّر",
        text: isEn
          ? "Go to the Briefly NewsStream console login page."
          : "انتقل إلى صفحة تسجيل الدخول في لوحة Briefly NewsStream.",
        url: absoluteUrl("/console/login"),
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: isEn ? "Create or sign in to your account" : "أنشئ حساباً أو سجّل الدخول",
        text: isEn
          ? "Sign up with email or sign in to your existing workspace."
          : "سجّل بالبريد أو ادخل إلى مساحة عملك الحالية.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: isEn ? "Create an API key" : "أنشئ مفتاح API",
        text: isEn
          ? "Open API keys in the console and create a key for your app."
          : "افتح مفاتيح الواجهة في اللوحة وأنشئ مفتاحاً لتطبيقك.",
        url: absoluteUrl("/console/keys"),
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: isEn ? "Call the news API" : "استدعِ واجهة الأخبار",
        text: isEn
          ? "Use the key in the explorer or your HTTP client to fetch bilingual market news."
          : "استخدم المفتاح في المستكشف أو عميل HTTP لجلب أخبار الأسواق ثنائية اللغة.",
        url: absoluteUrl("/developers"),
      },
    ],
  };
}

export function serviceJsonLd(lang: SeoLang) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: lang === "en" ? PRODUCT_LINE_EN : PRODUCT_LINE_AR,
    serviceType: "News API",
    provider: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
    description: lang === "en" ? AEO_ENTITY_ANSWER_EN : AEO_ENTITY_ANSWER_AR,
    areaServed: areaServedSchema(),
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: absoluteUrl("/developers"),
      availableLanguage: ["Arabic", "English"],
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function collectionPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
  lang: SeoLang;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: input.lang,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
    about: areaServedSchema().slice(0, 8),
  };
}

export function newsArticleJsonLd(input: {
  lang: SeoLang;
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string | null;
  publishedAt: string;
  sourceName: string;
  country?: string;
}) {
  const pagePath = `/news/${input.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.title.slice(0, 110),
    description: input.summary.slice(0, 300),
    datePublished: input.publishedAt,
    dateModified: input.publishedAt,
    inLanguage: input.lang,
    mainEntityOfPage: absoluteUrl(pagePath),
    url: absoluteUrl(pagePath),
    image: input.imageUrl ? [input.imageUrl] : [ogShareAbsoluteUrl()],
    author: {
      "@type": "Organization",
      name: input.sourceName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: brandLogoJsonLd(),
    },
    isBasedOn: input.url,
    about: input.country
      ? { "@type": "Country", name: input.country }
      : undefined,
  };
}

export function jsonLdScript(data: unknown | unknown[]) {
  const payload = Array.isArray(data) ? data : [data];
  return {
    __html: JSON.stringify(payload.length === 1 ? payload[0] : payload),
  };
}
