import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlatformOverviewPdf } from "../src/lib/console/platform-overview-pdf";

const here = dirname(fileURLToPath(import.meta.url));
export const PLATFORM_OVERVIEW_PUBLIC_PATH = resolve(
  here,
  "../public/console/platform-overview.pdf",
);

const out = PLATFORM_OVERVIEW_PUBLIC_PATH;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buildPlatformOverviewPdf());
console.log(`Wrote ${out}`);
