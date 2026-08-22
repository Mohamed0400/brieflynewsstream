import { z } from "zod";
import { prisma } from "./prisma";
import { cleanText } from "./classify";
import { isArabicText, isEnglishText } from "./article-translation";
import { limits } from "./limits";

type EditorialInput = {
  id: string;
  title: string;
  summary: string;
  publisher: string | null;
  source: { name: string };
  displayTitle: string | null;
  displaySummary: string | null;
  titleAr?: string | null;
  summaryAr?: string | null;
  translatedAt?: Date | null;
};

const editorialResponseSchema = z.object({
  articles: z.array(z.object({
    id: z.string(),
    displayTitle: z.string().min(10),
    displaySummary: z.string().min(20),
  })),
});

export function normalizeDisplayHeadline(value: string) {
  return cleanText(value)
    .replace(/\.{3,}|…/g, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[-–—:]\s*$/, "")
    .trim();
}

function fallbackDeck(summary: string, title: string) {
  const cleaned = cleanText(summary);
  if (!cleaned) return `The latest development centers on ${title.replace(/[.!?]$/, "")}.`;
  const firstSentence = cleaned.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return firstSentence && firstSentence.length >= 30 ? firstSentence : cleaned;
}

function fallbackEdits(articles: EditorialInput[]) {
  return articles.map((article) => ({
    id: article.id,
    displayTitle: normalizeDisplayHeadline(article.title),
    displaySummary: fallbackDeck(article.summary, article.title),
  }));
}

function extractOutputText(payload: {
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}) {
  const finalOutput = payload.steps?.filter((step) => step.type === "model_output").at(-1);
  return (finalOutput?.content ?? [])
    .filter((content) => content.type === "text")
    .map((content) => content.text ?? "")
    .join("");
}

async function requestEditorialEdits(articles: EditorialInput[]) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key || process.env.GOOGLE_EDITORIAL_ENABLED !== "true") {
    return fallbackEdits(articles);
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const inputArticles = articles.map((article) => ({
    id: article.id,
    originalHeadline: article.title,
    sourceSummary: cleanText(article.summary).slice(0, 700),
    publisher: article.publisher || article.source.name,
  }));
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": key,
    },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model,
      input: [
        "You are the senior financial-news copy editor for a professional agency display shown on a large public screen.",
        "Rewrite each supplied headline so it stands alone, is immediately clear, and contains the essential subject and action. Use one main idea, active voice, sentence case, short familiar words, and a calm factual tone.",
        "Headline requirements: 45-110 characters where the facts allow; never truncate; never use ellipses; never use clickbait, vague pronouns, unexplained abbreviations, clever wordplay, or unsupported implications.",
        "Write one displaySummary sentence of 80-200 characters explaining the market context or why the development matters.",
        "Use only facts explicitly present in originalHeadline, sourceSummary and publisher. Do not add names, numbers, causes, forecasts or conclusions. If context is insufficient, clean the original conservatively instead of guessing.",
        `Articles:\n${JSON.stringify(inputArticles)}`,
      ].join("\n\n"),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["articles"],
          properties: {
            articles: {
              type: "array",
              maxItems: Math.max(limits.dailyEdition, articles.length),
              items: {
                type: "object",
                additionalProperties: false,
                required: ["id", "displayTitle", "displaySummary"],
                properties: {
                  id: { type: "string" },
                  displayTitle: { type: "string" },
                  displaySummary: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
  });
  const payload = await response.json() as {
    steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(`Gemini editorial ${response.status}: ${payload.error?.message || "request failed"}`);
  }
  return editorialResponseSchema.parse(JSON.parse(extractOutputText(payload) || "{}")).articles;
}

export async function editorializeArticles(articles: EditorialInput[]) {
  const pending = articles.filter((article) => !article.displayTitle || !article.displaySummary);
  if (!pending.length) return;

  let edits: ReturnType<typeof fallbackEdits>;
  try {
    edits = await requestEditorialEdits(pending);
  } catch (error) {
    console.warn("Editorial rewrite failed; applying safe deterministic copy.", error);
    edits = fallbackEdits(pending);
  }

  const byId = new Map(edits.map((edit) => [edit.id, edit]));
  await prisma.$transaction(
    pending.map((article) => {
      const edit = byId.get(article.id) ?? fallbackEdits([article])[0];
      const displayTitle = normalizeDisplayHeadline(edit.displayTitle) || normalizeDisplayHeadline(article.title);
      const displaySummary = cleanText(edit.displaySummary) || fallbackDeck(article.summary, article.title);
      const sourceIsArabic = isArabicText(article.title);
      const englishTitle = isEnglishText(displayTitle) ? displayTitle : null;
      const englishSummary = isEnglishText(displaySummary) ? displaySummary : null;
      const existingArabicTitle = isArabicText(article.titleAr) ? article.titleAr : null;
      const existingArabicSummary = isArabicText(article.summaryAr) ? article.summaryAr : null;
      const arabicTitle = sourceIsArabic ? article.title : existingArabicTitle;
      const arabicSummary = sourceIsArabic
        ? (article.summary || article.title)
        : existingArabicSummary;
      const bilingualReady = Boolean(
        englishTitle
        && englishSummary
        && (arabicTitle || sourceIsArabic)
        && (arabicSummary || sourceIsArabic),
      );
      return prisma.article.update({
        where: { id: article.id },
        data: {
          displayTitle,
          displaySummary,
          ...(englishTitle ? { titleEn: englishTitle } : {}),
          ...(englishSummary ? { summaryEn: englishSummary } : {}),
          ...(arabicTitle ? { titleAr: arabicTitle } : {}),
          ...(arabicSummary ? { summaryAr: arabicSummary } : {}),
          translatedAt: bilingualReady ? (article.translatedAt ?? new Date()) : null,
          editorializedAt: new Date(),
        },
      });
    }),
  );
}
