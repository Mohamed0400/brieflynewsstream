/** Gulf-audience content filter for sexual, vulgar, and adult lifestyle news. */

/** Always block — explicit adult content and vulgar slurs. */
const HARD_BLOCK_PHRASES_EN = [
  "porn",
  "pornography",
  "pornographic",
  "pornhub",
  "xvideos",
  "xhamster",
  "xnxx",
  "onlyfans",
  "sex tape",
  "sex video",
  "sex scandal",
  "sex party",
  "sex chat",
  "sex site",
  "sex worker",
  "oral sex",
  "anal sex",
  "have sex",
  "nude photo",
  "nude leak",
  "nude selfie",
  "naked photo",
  "leaked nudes",
  "adult film",
  "adult video",
  "adult content",
  "adult entertainment",
  "adult website",
  "erotic video",
  "erotic film",
  "strip club",
  "strip tease",
  "escort service",
  "escort agency",
  "revenge porn",
  "deepfake porn",
  "playboy",
  "hentai",
  "blowjob",
  "handjob",
  "masturbat",
  "orgy",
  "orgies",
];

/** Block lifestyle / gossip sexual stories when not covered by hard blocks. */
const SOFT_BLOCK_PHRASES_EN = [
  "love affair",
  "extramarital",
  "affair scandal",
  "celebrity affair",
  "cheating scandal",
  "dating app",
  "dating site",
  "dating profile",
  "hookup app",
  "romance rumor",
  "romantic affair",
  "bedroom secrets",
  "kiss and tell",
  "lingerie show",
  "lingerie fashion",
  "lingerie model",
  "victoria's secret fashion",
  "bikini model",
  "swimsuit model",
  "sexting",
  "fling with",
  "secret lover",
  "love triangle",
  "steamy affair",
  "intimate photos",
  "intimate video",
  "lewd message",
  "salacious",
];

/** Legitimate market / policy headlines that can mention adjacent vocabulary. */
const ALLOW_PHRASES = [
  "gender pay gap",
  "gender equality",
  "gender diversity",
  "gender balance",
  "gender gap",
  "workplace gender",
  "women in the workplace",
  "women on boards",
  "essex",
  "middlesex",
  "sussex",
  "wessex",
  "sexual harassment policy",
  "anti-harassment policy",
  "workplace harassment policy",
  "anti sexual harassment",
  "human trafficking",
  "trafficking ring",
  "trafficking law",
  "trafficking bill",
  // Arabic policy / workplace
  "المساواة بين الجنسين",
  "تكافؤ الفرص",
  "تمكين المرأة",
  "سياسة مكافحة التحرش",
  "مكافحة التحرش",
  "الاتجار بالبشر",
  "قانون الاتجار",
];

/** Explicit adult / vulgar Arabic phrases. */
const HARD_BLOCK_PHRASES_AR = [
  "إباحي",
  "اباحي",
  "إباحية",
  "اباحية",
  "فيديو إباحي",
  "أفلام إباحية",
  "افلام إباحية",
  "موقع إباحي",
  "محتوى إباحي",
  "فضيحة جنسية",
  "علاقة جنسية",
  "ممارسة الجنس",
  "جنس صريح",
  "صور عارية",
  "عارية",
  "عري",
  "عراة",
  "عُري",
  "دعارة",
  "بغاء",
  "عاهرة",
  "prostitut", // transliterated in Arabic feeds
];

/** Gossip / lifestyle sexual Arabic phrases. */
const SOFT_BLOCK_PHRASES_AR = [
  "فضيحة حب",
  "علاقة غرامية",
  "علاقة سرية",
  "خيانة زوجية",
  "مثلث حب",
  "فضيحة عاطفية",
  "تطبيق مواعدة",
  "مواعدة عبر",
  "عارضة أزياء داخلية",
  "ملابس داخلية",
  "فضيحة فاضحة",
  "رسائل جنسية",
  "صور حميمة",
];

/** Single-token hard blocks with Latin word boundaries (avoids Essex, Middlesex). */
const HARD_BLOCK_TERMS_EN = [
  "porn",
  "pornhub",
  "onlyfans",
  "xnxx",
  "xvideos",
  "xhamster",
  "nude",
  "nudes",
  "orgasm",
  "brothel",
  "whore",
  "slut",
  "fuck",
  "fucking",
  "fucker",
  "motherfucker",
  "cunt",
  "pussy",
  "wank",
  "wanker",
  "dickhead",
  "blowjob",
  "handjob",
  "hentai",
  "playboy",
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** NFKC + punctuation collapse for multilingual phrase matching. */
export function normalizeContentText(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\u0640/g, "")
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
    .replace(/[\u0660-\u0669\u06f0-\u06f9]/g, " ")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesPhrase(text: string, phrase: string) {
  const normalizedPhrase = normalizeContentText(phrase);
  return normalizedPhrase.length > 0 && text.includes(normalizedPhrase);
}

function matchesAnyPhrase(text: string, phrases: readonly string[]) {
  return phrases.some((phrase) => matchesPhrase(text, phrase));
}

function matchesLatinTerm(text: string, term: string) {
  const escaped = escapeRegex(normalizeContentText(term));
  if (!escaped) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i").test(text);
}

function matchesAnyTerm(text: string, terms: readonly string[]) {
  return terms.some((term) => matchesLatinTerm(text, term));
}

export function isBlockedContent(title: string, summary = ""): boolean {
  const combined = normalizeContentText(`${title} ${summary}`);
  if (!combined) return false;

  if (matchesAnyPhrase(combined, HARD_BLOCK_PHRASES_EN)) return true;
  if (matchesAnyPhrase(combined, HARD_BLOCK_PHRASES_AR)) return true;
  if (matchesAnyTerm(combined, HARD_BLOCK_TERMS_EN)) return true;

  if (matchesAnyPhrase(combined, ALLOW_PHRASES)) return false;

  if (matchesAnyPhrase(combined, SOFT_BLOCK_PHRASES_EN)) return true;
  if (matchesAnyPhrase(combined, SOFT_BLOCK_PHRASES_AR)) return true;

  return false;
}

type ArticleSafetyFields = {
  title: string;
  summary: string;
  displayTitle?: string | null;
  displaySummary?: string | null;
  titleEn?: string | null;
  summaryEn?: string | null;
  titleAr?: string | null;
  summaryAr?: string | null;
};

export function articleSafetyText(article: ArticleSafetyFields): string {
  return [
    article.title,
    article.summary,
    article.displayTitle,
    article.displaySummary,
    article.titleEn,
    article.summaryEn,
    article.titleAr,
    article.summaryAr,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
}

/** True when any localized headline/body field matches the block lists. */
export function isBlockedArticle(article: ArticleSafetyFields): boolean {
  return isBlockedContent(articleSafetyText(article), "");
}
