export const ATTRIBUTION_COOKIE = "bns_attribution";
export const SESSION_COOKIE = "bns_session";

export type AttributionPayload = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  referrer: string;
  landingPath: string;
  channel: TrafficChannel;
};

export type TrafficChannel =
  | "direct"
  | "google"
  | "bing"
  | "chatgpt"
  | "openai"
  | "claude"
  | "perplexity"
  | "gemini"
  | "social"
  | "email"
  | "referral"
  | "other";

const LLM_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "openai.com",
  "claude.ai",
  "anthropic.com",
  "perplexity.ai",
  "gemini.google.com",
  "copilot.microsoft.com",
  "you.com",
  "phind.com",
  "poe.com",
];

export function classifyTrafficChannel(input: {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
}): TrafficChannel {
  const source = (input.utmSource || "").trim().toLowerCase();
  const medium = (input.utmMedium || "").trim().toLowerCase();
  const ref = (input.referrer || "").trim().toLowerCase();

  if (source.includes("chatgpt") || ref.includes("chatgpt.com") || ref.includes("chat.openai.com")) {
    return "chatgpt";
  }
  if (source.includes("openai") || ref.includes("openai.com")) return "openai";
  if (source.includes("claude") || ref.includes("claude.ai") || ref.includes("anthropic.com")) {
    return "claude";
  }
  if (source.includes("perplexity") || ref.includes("perplexity.ai")) return "perplexity";
  if (source.includes("gemini") || ref.includes("gemini.google.com")) return "gemini";
  if (LLM_HOSTS.some((host) => ref.includes(host))) return "other";

  if (medium === "email" || source.includes("newsletter") || source.includes("email")) return "email";
  if (
    medium === "social"
    || source.includes("twitter")
    || source.includes("x.com")
    || source.includes("linkedin")
    || source.includes("facebook")
    || source.includes("instagram")
    || ref.includes("twitter.com")
    || ref.includes("x.com")
    || ref.includes("linkedin.com")
    || ref.includes("facebook.com")
    || ref.includes("instagram.com")
  ) {
    return "social";
  }
  if (source.includes("google") || ref.includes("google.")) return "google";
  if (source.includes("bing") || ref.includes("bing.com")) return "bing";
  if (medium === "cpc" || medium === "paid") return source ? "referral" : "other";
  if (ref && !ref.includes("brieflynewsstream")) return "referral";
  if (!source && !ref) return "direct";
  return source ? "referral" : "direct";
}

export function parseAttributionSearchParams(params: URLSearchParams): Omit<AttributionPayload, "channel"> {
  return {
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmContent: params.get("utm_content") || "",
    utmTerm: params.get("utm_term") || "",
    referrer: "",
    landingPath: "",
  };
}

export function buildAttributionPayload(input: {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPath?: string;
}): AttributionPayload {
  const utmSource = (input.utmSource || "").slice(0, 200);
  const utmMedium = (input.utmMedium || "").slice(0, 200);
  const utmCampaign = (input.utmCampaign || "").slice(0, 200);
  const utmContent = (input.utmContent || "").slice(0, 200);
  const utmTerm = (input.utmTerm || "").slice(0, 200);
  const referrer = (input.referrer || "").slice(0, 500);
  const landingPath = (input.landingPath || "").slice(0, 300);
  return {
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    referrer,
    landingPath,
    channel: classifyTrafficChannel({ utmSource, utmMedium, referrer }),
  };
}

export function parseAttributionCookie(raw: string | undefined | null): AttributionPayload | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AttributionPayload>;
    if (!parsed || typeof parsed !== "object") return null;
    return buildAttributionPayload(parsed);
  } catch {
    return null;
  }
}

export function serializeAttributionCookie(payload: AttributionPayload) {
  return JSON.stringify(payload);
}

export const TRAFFIC_CHANNEL_LABELS: Record<TrafficChannel, { en: string; ar: string }> = {
  direct: { en: "Direct", ar: "مباشر" },
  google: { en: "Google", ar: "Google" },
  bing: { en: "Bing", ar: "Bing" },
  chatgpt: { en: "ChatGPT", ar: "ChatGPT" },
  openai: { en: "OpenAI", ar: "OpenAI" },
  claude: { en: "Claude", ar: "Claude" },
  perplexity: { en: "Perplexity", ar: "Perplexity" },
  gemini: { en: "Gemini", ar: "Gemini" },
  social: { en: "Social", ar: "وسائل التواصل" },
  email: { en: "Email", ar: "بريد" },
  referral: { en: "Referral", ar: "إحالة" },
  other: { en: "Other", ar: "أخرى" },
};
