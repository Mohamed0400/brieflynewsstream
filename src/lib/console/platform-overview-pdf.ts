import {
  RECEIPT_LOGO_HEIGHT,
  RECEIPT_LOGO_JPEG,
  RECEIPT_LOGO_WIDTH,
} from "../billing/receipt-logo";
import { COUNTRY_CATALOG } from "../countries";
import { CATEGORY_META, REGION_META } from "../market";
import { PLAN_DEFINITIONS } from "../plans";

export const PLATFORM_OVERVIEW_SITE_URL = "https://www.brieflynewsstream.com";
export const PLATFORM_OVERVIEW_CONSOLE_URL = `${PLATFORM_OVERVIEW_SITE_URL}/console`;
export const PLATFORM_OVERVIEW_FILENAME = "briefly-newsstream-platform.pdf";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const NAVY = "0.043 0.078 0.133";
const CYAN = "0.369 0.784 0.863";
const MUTED = "0.294 0.361 0.431";
const PAPER = "0.969 0.976 0.988";
const WHITE = "1 1 1";

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function ascii(value: string) {
  return Buffer.from(value, "ascii");
}

function fillRect(x: number, y: number, w: number, h: number, color: string) {
  return `${color} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`;
}

function strokeLine(x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
  return `${color} RG ${width.toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`;
}

function text(font: "F1" | "F2", size: number, x: number, y: number, value: string, color: string) {
  return `${color} rg BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfEscape(value)}) Tj ET`;
}

function wrapAscii(value: string, width: number) {
  const words = value.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function linkAnnot(rect: [number, number, number, number], uri: string) {
  const [x1, y1, x2, y2] = rect;
  return ascii(
    `<< /Type /Annot /Subtype /Link /Rect [${x1.toFixed(2)} ${y1.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}] ` +
      `/Border [0 0 0] /A << /S /URI /URI (${pdfEscape(uri)}) >> >>`,
  );
}

type PdfPage = {
  ops: string[];
  annots: Buffer[];
};

function pageHeader(title: string, subtitle: string) {
  return [
    fillRect(0, PAGE_H - 5, PAGE_W, 5, CYAN),
    fillRect(0, PAGE_H - 5, 8, 5, NAVY),
    text("F2", 11, MARGIN, PAGE_H - 36, title.toUpperCase(), NAVY),
    text("F1", 9, MARGIN, PAGE_H - 52, subtitle, MUTED),
    strokeLine(MARGIN, PAGE_H - 60, PAGE_W - MARGIN, PAGE_H - 60, NAVY, 0.5),
  ];
}

function pageFooter(pageNum: number, total: number) {
  return [
    fillRect(0, 0, PAGE_W, 28, NAVY),
    fillRect(0, 28, PAGE_W, 2, CYAN),
    text("F1", 8, MARGIN, 10, PLATFORM_OVERVIEW_SITE_URL.replace(/^https:\/\//, ""), CYAN),
    text("F1", 8, PAGE_W - MARGIN - 48, 10, `${pageNum} / ${total}`, WHITE),
  ];
}

function bodyParagraph(yStart: number, paragraph: string, maxLines = 6) {
  const lines = wrapAscii(paragraph, 92).slice(0, maxLines);
  return lines.flatMap((line, index) => text("F1", 10, MARGIN, yStart - index * 14, line, NAVY));
}

function bulletList(yStart: number, items: string[], maxItems = 8) {
  return items.slice(0, maxItems).flatMap((item, index) => {
    const y = yStart - index * 18;
    const lines = wrapAscii(item, 84);
    return [
      fillRect(MARGIN, y - 4, 4, 4, CYAN),
      text("F1", 9, MARGIN + 12, y, lines[0] ?? "", NAVY),
      ...(lines[1] ? [text("F1", 9, MARGIN + 12, y - 12, lines[1], MUTED)] : []),
    ];
  });
}

function buildPages(): PdfPage[] {
  const logoWidth = 168;
  const logoHeight = logoWidth * (RECEIPT_LOGO_HEIGHT / RECEIPT_LOGO_WIDTH);
  const logoX = MARGIN;
  const logoY = PAGE_H - 40 - logoHeight;
  const contentWidth = PAGE_W - MARGIN * 2;
  const siteLabel = PLATFORM_OVERVIEW_SITE_URL.replace(/^https:\/\//, "");
  const consoleLabel = PLATFORM_OVERVIEW_CONSOLE_URL.replace(/^https:\/\//, "");

  const page1: PdfPage = {
    ops: [
      fillRect(0, PAGE_H - 5, PAGE_W, 5, CYAN),
      fillRect(0, PAGE_H - 5, 8, 5, NAVY),
      `q ${logoWidth.toFixed(2)} 0 0 ${logoHeight.toFixed(2)} ${logoX.toFixed(2)} ${logoY.toFixed(2)} cm /Im1 Do Q`,
      text("F2", 12, 360, logoY + logoHeight - 16, "PLATFORM BRIEF", NAVY),
      text("F1", 9, 360, logoY + logoHeight - 32, "Bilingual market-news API", MUTED),
      strokeLine(MARGIN, logoY - 14, MARGIN + 72, logoY - 14, CYAN, 2.2),
      strokeLine(MARGIN + 72, logoY - 14, PAGE_W - MARGIN, logoY - 14, NAVY, 0.7),
      text("F2", 20, MARGIN, logoY - 48, "Briefly NewsStream", NAVY),
      text("F1", 11, MARGIN, logoY - 68, "Market intelligence for products that need to know what news matters.", MUTED),
      ...bodyParagraph(logoY - 100, "This brief covers coverage, market-impact scoring, API authentication, daily limits, and the core endpoints your team will call from day one.", 3),
      text("F2", 11, MARGIN, logoY - 160, "Platform at a glance", NAVY),
      ...[
        [`${COUNTRY_CATALOG.length}+ countries`, "Middle East, Americas, Europe, and global desks in one feed."],
        ["Arabic + English", "Native Arabic with complete English fields in the same JSON object."],
        [`${CATEGORY_META.length} categories`, "Finance, oil, commodities, banking, crypto, policy, and more."],
        [`${REGION_META.length} regions`, "Filter by country, region, nationality audience, or impact score."],
      ].flatMap(([title, body], index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = MARGIN + col * (contentWidth / 2 + 6);
        const y = logoY - 190 - row * 78;
        const w = (contentWidth - 6) / 2;
        const h = 68;
        return [
          fillRect(x, y, w, h, PAPER),
          fillRect(x, y, 3, h, CYAN),
          text("F2", 10, x + 12, y + 48, title, NAVY),
          ...wrapAscii(body, 34).slice(0, 2).map((line, lineIndex) =>
            text("F1", 8, x + 12, y + 30 - lineIndex * 12, line, MUTED),
          ),
        ];
      }),
      fillRect(0, 0, PAGE_W, 92, NAVY),
      fillRect(0, 92, PAGE_W, 3, CYAN),
      text("F2", 9, MARGIN, 62, "Open the platform", WHITE),
      text("F1", 10, MARGIN, 44, siteLabel, CYAN),
      text("F1", 9, MARGIN, 26, `Console  ${consoleLabel}`, WHITE),
      text("F1", 8, 368, 26, "Briefly NewsStream platform brief", "0.73 0.82 0.86"),
    ],
    annots: [
      linkAnnot([MARGIN, 38, MARGIN + 280, 58], PLATFORM_OVERVIEW_SITE_URL),
      linkAnnot([MARGIN, 20, MARGIN + 360, 36], PLATFORM_OVERVIEW_CONSOLE_URL),
    ],
  };

  const page2: PdfPage = {
    ops: [
      ...pageHeader("Market impact scoring", "Rank stories by market effect, not only recency"),
      text("F2", 14, MARGIN, PAGE_H - 88, "What impact means", NAVY),
      ...bodyParagraph(PAGE_H - 108, "Every story receives a composite market-impact score from 0 to 100. The score blends source quality, freshness, relevance, and keyword signals for rates, oil, metals, and the US dollar.", 4),
      text("F2", 11, MARGIN, PAGE_H - 180, "Signal dimensions", NAVY),
      ...bulletList(PAGE_H - 200, [
        "Rates — central banks, yields, and policy language.",
        "Oil & energy — crude, OPEC, and energy supply headlines.",
        "Metals — gold and commodity market moves.",
        "USD — dollar, forex, and currency desk stories.",
        "Market impact — blended desk signal used for default ranking.",
      ]),
      text("F2", 11, MARGIN, 320, "How to use it in the API", NAVY),
      ...bodyParagraph(300, "Pass sort=score on GET /api/v1/market-news to rank by market impact. Use sort=date when you need newest-first instead. Each item includes a score object with final and component values.", 4),
      fillRect(MARGIN, 210, contentWidth, 88, PAPER),
      fillRect(MARGIN, 210, 3, 88, CYAN),
      text("F2", 9, MARGIN + 14, 280, "Example response fields", NAVY),
      text("F1", 8, MARGIN + 14, 262, '"score": { "final": 72.4, "marketImpact": 65, "ratesImpact": 30 }', MUTED),
      text("F1", 8, MARGIN + 14, 246, '"title", "summary", "arabic", "english", "country", "category"', MUTED),
      ...bodyParagraph(180, "Impact helps trading tools, research dashboards, and AI agents prioritize the stories most likely to move a desk — without reading every headline manually.", 3),
    ],
    annots: [],
  };

  const free = PLAN_DEFINITIONS.FREE;
  const pro = PLAN_DEFINITIONS.PRO;

  const page3: PdfPage = {
    ops: [
      ...pageHeader("API access", "Authentication, plans, and daily limits"),
      text("F2", 14, MARGIN, PAGE_H - 88, "Authentication", NAVY),
      ...bodyParagraph(PAGE_H - 108, "Send your secret key on every request as the X-API-Key header. Create keys in the console under API keys. Keys are stored as secure hashes — the full secret is shown only once at creation.", 3),
      text("F2", 11, MARGIN, PAGE_H - 168, "Plans (account-wide daily pool, UTC midnight reset)", NAVY),
      ...[
        [`Free — ${free.dailyRequests} requests/day, ${free.maxKeys} key`, "Evaluation and prototypes."],
        [`Pro — ${pro.dailyRequests} requests/day, up to ${pro.maxKeys} keys`, "Shared quota across all active keys."],
        ["Enterprise — custom limits", "Higher volume and SLA options via sales."],
      ].flatMap(([title, body], index) => {
        const y = PAGE_H - 198 - index * 52;
        return [
          fillRect(MARGIN, y, contentWidth, 44, PAPER),
          text("F2", 10, MARGIN + 12, y + 26, title, NAVY),
          text("F1", 9, MARGIN + 12, y + 12, body, MUTED),
        ];
      }),
      text("F2", 11, MARGIN, 420, "Quota headers on every response", NAVY),
      ...bulletList(400, [
        "X-API-Quota-Limit — daily cap for the account plan.",
        "X-API-Quota-Used — requests consumed today.",
        "X-API-Quota-Remaining — requests left before midnight UTC.",
        "X-API-Plan — FREE, PRO, or ENTERPRISE.",
        "HTTP 429 quota_exceeded when the daily pool is exhausted.",
      ]),
    ],
    annots: [],
  };

  const page4: PdfPage = {
    ops: [
      ...pageHeader("API reference", "Core endpoints and filters"),
      text("F2", 11, MARGIN, PAGE_H - 88, "Primary endpoints", NAVY),
      ...bulletList(PAGE_H - 108, [
        "GET /api/v1/market-news — filterable article stream.",
        "GET /api/v1/market-news/today — ranked daily edition.",
        "GET /api/v1/market-news/editions — list stored editions.",
        "GET /api/v1/market-news/nationality?nationality=IN — community briefing.",
        "GET /api/v1/meta/categories — supported market categories.",
        "GET /api/v1/meta/countries — supported country catalog.",
        "GET /api/v1/meta/nationalities — nationality audiences.",
        "GET /api/v1/health — service readiness probe.",
      ], 8),
      text("F2", 11, MARGIN, 420, "Common query parameters", NAVY),
      ...bulletList(400, [
        "q — Arabic or English search, including multi-word phrases.",
        "country, region, category, nationality — audience and desk filters.",
        "lang=ar|en — response language for title and summary.",
        "sort=score|date — impact ranking or newest first.",
        "from, to, date — published-at window.",
        "limit, offset — pagination (default limit 50, max 500).",
      ]),
      text("F2", 11, MARGIN, 250, "Quick start", NAVY),
      text("F1", 8, MARGIN, 232, 'curl -H "X-API-Key: YOUR_KEY" "https://www.brieflynewsstream.com/api/v1/market-news?lang=ar&sort=score&limit=10"', MUTED),
    ],
    annots: [],
  };

  const page5: PdfPage = {
    ops: [
      ...pageHeader("Console workflow", "From signup to first production call"),
      ...[
        "Register in the console with email and password.",
        "Mint an API key under API keys (copy it immediately).",
        "Check Billing for your plan and daily usage.",
        "Open API Explorer to test filters with your key.",
        "Integrate GET /api/v1/market-news in your product.",
        "Upgrade to Pro from Billing when you need higher limits.",
      ].flatMap((step, index) => {
        const y = PAGE_H - 100 - index * 34;
        return [
          fillRect(MARGIN, y - 6, 22, 22, CYAN),
          text("F2", 10, MARGIN + 7, y + 2, String(index + 1), NAVY),
          text("F1", 10, MARGIN + 34, y, step, NAVY),
        ];
      }),
      text("F2", 11, MARGIN, 360, "Support & billing", NAVY),
      ...bodyParagraph(340, "Paid plans include invoice history and PDF receipts in Billing after payment. Questions: hello@brieflynewsstream.com", 3),
      fillRect(MARGIN, 250, contentWidth, 64, PAPER),
      fillRect(MARGIN, 250, 3, 64, CYAN),
      text("F2", 10, MARGIN + 14, 298, "Console links", NAVY),
      text("F1", 9, MARGIN + 14, 280, siteLabel, NAVY),
      text("F1", 9, MARGIN + 14, 264, consoleLabel, MUTED),
    ],
    annots: [
      linkAnnot([MARGIN + 14, 256, MARGIN + 280, 288], PLATFORM_OVERVIEW_SITE_URL),
      linkAnnot([MARGIN + 14, 240, MARGIN + 360, 262], PLATFORM_OVERVIEW_CONSOLE_URL),
    ],
  };

  const pages = [page1, page2, page3, page4, page5];
  return pages.map((page, index) => ({
    ops: [...page.ops, ...pageFooter(index + 1, pages.length)],
    annots: page.annots,
  }));
}

export function buildPlatformOverviewPdf() {
  const pages = buildPages();
  const imageStream = Buffer.concat([
    ascii(
      `<< /Type /XObject /Subtype /Image /Width ${RECEIPT_LOGO_WIDTH} /Height ${RECEIPT_LOGO_HEIGHT} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${RECEIPT_LOGO_JPEG.length} >>\nstream\n`,
    ),
    RECEIPT_LOGO_JPEG,
    ascii("\nendstream"),
  ]);

  type Entry = { kind: string; body: Buffer };
  const entries: Entry[] = [
    { kind: "catalog", body: ascii("") },
    { kind: "pages", body: ascii("") },
  ];

  const pageMeta: Array<{ pageIdx: number; contentIdx: number; annotIdxs: number[] }> = [];
  for (const page of pages) {
    const pageIdx = entries.length;
    entries.push({ kind: "page", body: ascii("") });
    const contentIdx = entries.length;
    const contentBytes = ascii(page.ops.join("\n"));
    entries.push({
      kind: "content",
      body: Buffer.concat([
        ascii(`<< /Length ${contentBytes.length} >>\nstream\n`),
        contentBytes,
        ascii("\nendstream"),
      ]),
    });
    const annotIdxs: number[] = [];
    for (const annot of page.annots) {
      annotIdxs.push(entries.length);
      entries.push({ kind: "annot", body: annot });
    }
    pageMeta.push({ pageIdx, contentIdx, annotIdxs });
  }

  const fontRegularIdx = entries.length + 1;
  const fontBoldIdx = entries.length + 2;
  const imageIdx = entries.length + 3;
  entries.push(
    { kind: "font", body: ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>") },
    { kind: "font", body: ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>") },
    { kind: "image", body: imageStream },
  );

  entries[0].body = ascii("<< /Type /Catalog /Pages 2 0 R >>");
  entries[1].body = ascii(
    `<< /Type /Pages /Kids [${pageMeta.map((meta) => `${meta.pageIdx + 1} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  );

  for (const meta of pageMeta) {
    const annotsPart = meta.annotIdxs.length
      ? `/Annots [${meta.annotIdxs.map((idx) => `${idx + 1} 0 R`).join(" ")}] `
      : "";
    entries[meta.pageIdx].body = ascii(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${meta.contentIdx + 1} 0 R ${annotsPart}` +
        `/Resources << /Font << /F1 ${fontRegularIdx} 0 R /F2 ${fontBoldIdx} 0 R >> /XObject << /Im1 ${imageIdx} 0 R >> >> >>`,
    );
  }

  const parts: Buffer[] = [ascii("%PDF-1.4\n")];
  const offsets = [0];
  let size = parts[0].length;
  for (let i = 0; i < entries.length; i += 1) {
    offsets.push(size);
    const object = Buffer.concat([
      ascii(`${i + 1} 0 obj\n`),
      entries[i].body,
      ascii("\nendobj\n"),
    ]);
    parts.push(object);
    size += object.length;
  }
  const xref = size;
  let xrefBlock = `xref\n0 ${entries.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= entries.length; i += 1) {
    xrefBlock += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xrefBlock += `trailer\n<< /Size ${entries.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  parts.push(ascii(xrefBlock));
  return Buffer.concat(parts);
}
