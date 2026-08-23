import {
  RECEIPT_LOGO_HEIGHT,
  RECEIPT_LOGO_JPEG,
  RECEIPT_LOGO_WIDTH,
} from "../billing/receipt-logo";
import { COUNTRY_CATALOG } from "../countries";
import { CATEGORY_META, REGION_META } from "../market";

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

const FACTS = [
  {
    title: `About ${COUNTRY_CATALOG.length} countries`,
    body: "Middle East, America, and Global desks in one bilingual feed.",
  },
  {
    title: "Arabic and English on every brief",
    body: "Native Arabic plus a complete English field set in the same JSON.",
  },
  {
    title: `${CATEGORY_META.length} market categories`,
    body: "Precious metals, finance, economics, oil & gas, Middle East economy, commodities, banking, real estate, technology, energy & utilities, global trade, currencies, crypto, shipping, insurance, policy, and markets.",
  },
  {
    title: `${REGION_META.length} coverage regions`,
    body: "Filter by country, region, nationality audience, or impact score.",
  },
] as const;

const STEPS = [
  "Open the console and mint an API key.",
  "Call GET /api/v1/market-news with that key.",
  "Read Arabic title and summary, with english fields beside them.",
] as const;

export function buildPlatformOverviewPdf() {
  const logoWidth = 168;
  const logoHeight = logoWidth * (RECEIPT_LOGO_HEIGHT / RECEIPT_LOGO_WIDTH);
  const logoX = MARGIN;
  const logoY = PAGE_H - 40 - logoHeight;
  const contentWidth = PAGE_W - MARGIN * 2;
  const siteLabel = PLATFORM_OVERVIEW_SITE_URL.replace(/^https:\/\//, "");
  const consoleLabel = PLATFORM_OVERVIEW_CONSOLE_URL.replace(/^https:\/\//, "");
  const cardH = 72;
  const cardGap = 10;
  const cardsTop = logoY - 84;
  const footerH = 92;

  const cardOps = FACTS.flatMap((fact, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + col * (contentWidth / 2 + cardGap / 2);
    const y = cardsTop - row * (cardH + cardGap) - cardH;
    const w = (contentWidth - cardGap) / 2;
    const body = wrapAscii(fact.body, 36);
    return [
      fillRect(x, y, w, cardH, PAPER),
      fillRect(x, y, 3, cardH, CYAN),
      text("F2", 10, x + 14, y + 48, fact.title, NAVY),
      ...body.slice(0, 2).map((line, lineIndex) =>
        text("F1", 8, x + 14, y + 30 - lineIndex * 12, line, MUTED),
      ),
    ];
  });

  const stepsTop = cardsTop - 2 * (cardH + cardGap) - 36;
  const stepOps = STEPS.flatMap((step, index) => {
    const y = stepsTop - index * 28;
    return [
      fillRect(MARGIN, y - 6, 18, 18, CYAN),
      text("F2", 9, MARGIN + 6, y, String(index + 1), NAVY),
      text("F1", 10, MARGIN + 28, y, step, NAVY),
    ];
  });

  const ops = [
    fillRect(0, PAGE_H - 5, PAGE_W, 5, CYAN),
    fillRect(0, PAGE_H - 5, 8, 5, NAVY),
    `q ${logoWidth.toFixed(2)} 0 0 ${logoHeight.toFixed(2)} ${logoX.toFixed(2)} ${logoY.toFixed(2)} cm /Im1 Do Q`,
    text("F2", 12, 360, logoY + logoHeight - 16, "PLATFORM BRIEF", NAVY),
    text("F1", 9, 360, logoY + logoHeight - 32, "Bilingual market-news API", MUTED),
    strokeLine(MARGIN, logoY - 14, MARGIN + 72, logoY - 14, CYAN, 2.2),
    strokeLine(MARGIN + 72, logoY - 14, PAGE_W - MARGIN, logoY - 14, NAVY, 0.7),
    text("F2", 18, MARGIN, logoY - 44, "Briefly NewsStream platform", NAVY),
    text("F1", 10, MARGIN, logoY - 62, "Market news for desks that read Arabic first and ship in English.", MUTED),
    ...cardOps,
    text("F2", 11, MARGIN, stepsTop + 28, "Start in the console", NAVY),
    ...stepOps,
    fillRect(0, 0, PAGE_W, footerH, NAVY),
    fillRect(0, footerH, PAGE_W, 3, CYAN),
    text("F2", 9, MARGIN, 62, "Open the platform", WHITE),
    text("F1", 10, MARGIN, 44, siteLabel, CYAN),
    text("F1", 9, MARGIN, 26, `Console  ${consoleLabel}`, WHITE),
    text("F1", 8, 368, 26, "Briefly NewsStream platform brief", "0.73 0.82 0.86"),
  ];

  const contentBytes = ascii(ops.join("\n"));
  const imageStream = Buffer.concat([
    ascii(
      `<< /Type /XObject /Subtype /Image /Width ${RECEIPT_LOGO_WIDTH} /Height ${RECEIPT_LOGO_HEIGHT} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${RECEIPT_LOGO_JPEG.length} >>\nstream\n`,
    ),
    RECEIPT_LOGO_JPEG,
    ascii("\nendstream"),
  ]);

  const objects = [
    ascii("<< /Type /Catalog /Pages 2 0 R >>"),
    ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    ascii(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R " +
        "/Annots [8 0 R 9 0 R] " +
        "/Resources << /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im1 7 0 R >> >> >>",
    ),
    Buffer.concat([
      ascii(`<< /Length ${contentBytes.length} >>\nstream\n`),
      contentBytes,
      ascii("\nendstream"),
    ]),
    ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"),
    imageStream,
    linkAnnot([MARGIN, 38, MARGIN + 280, 58], PLATFORM_OVERVIEW_SITE_URL),
    linkAnnot([MARGIN, 20, MARGIN + 360, 36], PLATFORM_OVERVIEW_CONSOLE_URL),
  ];

  const parts: Buffer[] = [ascii("%PDF-1.4\n")];
  const offsets = [0];
  let size = parts[0].length;
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(size);
    const object = Buffer.concat([
      ascii(`${i + 1} 0 obj\n`),
      objects[i],
      ascii("\nendobj\n"),
    ]);
    parts.push(object);
    size += object.length;
  }
  const xref = size;
  let xrefBlock = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    xrefBlock += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xrefBlock += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  parts.push(ascii(xrefBlock));
  return Buffer.concat(parts);
}
