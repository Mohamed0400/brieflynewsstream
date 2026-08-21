import {
  RECEIPT_LOGO_HEIGHT,
  RECEIPT_LOGO_JPEG,
  RECEIPT_LOGO_WIDTH,
} from "./receipt-logo";

export const RECEIPT_SITE_URL = "https://www.brieflynewsstream.com";
export const RECEIPT_CONSOLE_URL = `${RECEIPT_SITE_URL}/console`;

export type ReceiptPdfInput = {
  number: string;
  status: "OPEN" | "PAID" | "VOID";
  description: string;
  issuedAt: Date;
  paidAt?: Date | null;
  dueAt?: Date | null;
  totalCents: number;
  amountPaidCents: number;
  example?: boolean;
};

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const NAVY = "0.043 0.078 0.133";
const CYAN = "0.369 0.784 0.863";
const MUTED = "0.294 0.361 0.431";
const PAPER = "0.969 0.976 0.988";
const RULE = "0.847 0.871 0.902";
const WHITE = "1 1 1";

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function money(cents: number) {
  return `USD ${(cents / 100).toFixed(2)}`;
}

function stamp(value: Date) {
  return value.toISOString().slice(0, 10);
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

function linkAnnot(rect: [number, number, number, number], uri: string) {
  const [x1, y1, x2, y2] = rect;
  return ascii(
    `<< /Type /Annot /Subtype /Link /Rect [${x1.toFixed(2)} ${y1.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}] ` +
      `/Border [0 0 0] /A << /S /URI /URI (${pdfEscape(uri)}) >> >>`,
  );
}

export function buildReceiptPdf(input: ReceiptPdfInput) {
  const heading = "PAYMENT RECEIPT";
  const paidStamp = input.paidAt ? stamp(input.paidAt) : input.dueAt ? stamp(input.dueAt) : "";
  const paidLabel = input.paidAt ? "Paid" : input.dueAt ? "Due" : "";
  const note = "Thank you for your payment.";

  const logoWidth = 158;
  const logoHeight = logoWidth * (RECEIPT_LOGO_HEIGHT / RECEIPT_LOGO_WIDTH);
  const logoX = MARGIN;
  const logoY = PAGE_H - 36 - logoHeight;
  const contentWidth = PAGE_W - MARGIN * 2;
  const tableTop = 520;
  const rowH = 28;
  const footerH = 92;
  const siteLabel = RECEIPT_SITE_URL.replace(/^https:\/\//, "");
  const consoleLabel = RECEIPT_CONSOLE_URL.replace(/^https:\/\//, "");

  const meta = [
    { label: "Invoice", value: input.number },
    { label: "Status", value: input.status },
    { label: "Issued", value: stamp(input.issuedAt) },
    ...(paidLabel ? [{ label: paidLabel, value: paidStamp }] : []),
  ];
  const metaY = logoY - 56;
  const metaW = contentWidth / meta.length;

  const ops = [
    fillRect(0, PAGE_H - 5, PAGE_W, 5, CYAN),
    fillRect(0, PAGE_H - 5, 8, 5, NAVY),
    `q ${logoWidth.toFixed(2)} 0 0 ${logoHeight.toFixed(2)} ${logoX.toFixed(2)} ${logoY.toFixed(2)} cm /Im1 Do Q`,
    text("F2", 11, 360, logoY + logoHeight - 18, heading, NAVY),
    text("F1", 9, 360, logoY + logoHeight - 34, "Bilingual market-news API", MUTED),
    strokeLine(MARGIN, logoY - 14, MARGIN + 72, logoY - 14, CYAN, 2.2),
    strokeLine(MARGIN + 72, logoY - 14, PAGE_W - MARGIN, logoY - 14, NAVY, 0.7),
    ...meta.flatMap((item, index) => {
      const x = MARGIN + index * metaW;
      return [
        text("F1", 8, x, metaY + 16, item.label.toUpperCase(), MUTED),
        text("F2", 11, x, metaY, item.value, NAVY),
      ];
    }),
    fillRect(MARGIN, tableTop, contentWidth, rowH, PAPER),
    text("F2", 8, MARGIN + 12, tableTop + 10, "DESCRIPTION", MUTED),
    text("F2", 8, 430, tableTop + 10, "AMOUNT", MUTED),
    strokeLine(MARGIN, tableTop, PAGE_W - MARGIN, tableTop, RULE, 0.6),
    text("F1", 11, MARGIN + 12, tableTop - 22, input.description, NAVY),
    text("F1", 11, 430, tableTop - 22, money(input.totalCents), NAVY),
    strokeLine(MARGIN, tableTop - rowH, PAGE_W - MARGIN, tableTop - rowH, RULE, 0.6),
    fillRect(MARGIN, tableTop - rowH * 2 - 4, 3, rowH, CYAN),
    text("F2", 11, MARGIN + 12, tableTop - rowH - 22, "Amount paid", NAVY),
    text("F2", 12, 430, tableTop - rowH - 22, money(input.amountPaidCents), NAVY),
    text("F1", 9, MARGIN, 168, note, MUTED),
    fillRect(0, 0, PAGE_W, footerH, NAVY),
    fillRect(0, footerH, PAGE_W, 3, CYAN),
    text("F2", 9, MARGIN, 62, "Open the platform", WHITE),
    text("F1", 10, MARGIN, 44, siteLabel, CYAN),
    text("F1", 9, MARGIN, 26, `Console  ${consoleLabel}`, WHITE),
    text("F1", 8, 390, 26, "Receipt for Briefly NewsStream", "0.73 0.82 0.86"),
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
    linkAnnot([MARGIN, 38, MARGIN + 280, 58], RECEIPT_SITE_URL),
    linkAnnot([MARGIN, 20, MARGIN + 360, 36], RECEIPT_CONSOLE_URL),
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

export const EXAMPLE_RECEIPT: ReceiptPdfInput = {
  number: "INV-2026-00001",
  status: "PAID",
  description: "Pro plan, monthly",
  issuedAt: new Date("2026-07-01T00:00:00.000Z"),
  paidAt: new Date("2026-07-03T00:00:00.000Z"),
  totalCents: 7000,
  amountPaidCents: 7000,
};
