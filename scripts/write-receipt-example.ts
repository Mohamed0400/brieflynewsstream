import { writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildReceiptPdf, EXAMPLE_RECEIPT } from "../src/lib/billing/receipt-pdf";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../public/billing/receipt-example.pdf");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buildReceiptPdf(EXAMPLE_RECEIPT));
console.log(`Wrote ${out}`);
