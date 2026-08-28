/**
 * Upload static brand / marketing images to Cloudinary with stable public IDs.
 *
 *   npm run media:upload
 *   dotenv -e .env.live -- npm run media:upload
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { uploadImageFile, uploadRawFile, isCloudinaryConfigured, cloudinaryConfig } from "../src/lib/cloudinary";
import { MEDIA, MEDIA_FOLDER, PLATFORM_OVERVIEW_PDF_ID } from "../src/lib/media";
import { buildPlatformOverviewPdf } from "../src/lib/console/platform-overview-pdf";

const root = path.join(process.cwd(), "public");

/** Local file → Cloudinary public_id (full path including folder). */
const ASSETS: { file: string; publicId: string }[] = [
  { file: "brand/logo-mark.png", publicId: MEDIA.logoMark },
  { file: "brand/logo-wordmark.png", publicId: MEDIA.logoWordmark },
  { file: "brand/logo-wordmark-on-dark.png", publicId: MEDIA.logoWordmarkOnDark },
  { file: "hero-newsstream.jpg", publicId: MEDIA.heroNewsstream },
  { file: "hero-markets.png", publicId: MEDIA.heroMarkets },
  { file: "og/og-share.jpg", publicId: MEDIA.ogShare },
  { file: "console-gate.png", publicId: MEDIA.consoleGate },
  { file: "concepts/concept-ar-first-desk.jpg", publicId: MEDIA.conceptArFirstDesk },
  { file: "concepts/concept-floating-stream.jpg", publicId: MEDIA.conceptFloatingStream },
  { file: "concepts/concept-bento-coverage.jpg", publicId: MEDIA.conceptBentoCoverage },
  { file: "concepts/concept-bilingual-pro.jpg", publicId: MEDIA.conceptBilingualPro },
  { file: "concepts/concept-stream-icons.jpg", publicId: MEDIA.conceptStreamIcons },
  { file: "marketing/bg-brief.png", publicId: MEDIA.briefBackground },
];

async function main() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary env missing. Set CLOUDINARY_URL or CLOUDINARY_* in .env");
  }

  const { cloudName } = cloudinaryConfig();
  console.log(`Uploading ${ASSETS.length} assets → cloud "${cloudName}" / ${MEDIA_FOLDER}\n`);

  for (const asset of ASSETS) {
    const abs = path.join(root, asset.file);
    if (!existsSync(abs)) {
      console.warn(`SKIP missing: ${asset.file}`);
      continue;
    }
    const uploaded = await uploadImageFile(abs, {
      publicId: asset.publicId,
      overwrite: true,
    });
    console.log(`OK  ${asset.file}`);
    console.log(`    → ${uploaded.publicId}`);
    console.log(`    → ${uploaded.secureUrl}`);
    console.log(
      `    → optimized: https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1200,c_limit/${uploaded.publicId}`,
    );
    console.log("");
  }

  const pdfPath = path.join(root, "console/platform-overview.pdf");
  mkdirSync(path.dirname(pdfPath), { recursive: true });
  writeFileSync(pdfPath, buildPlatformOverviewPdf());
  const pdfUpload = await uploadRawFile(pdfPath, {
    publicId: PLATFORM_OVERVIEW_PDF_ID,
    overwrite: true,
  });
  console.log("OK  console/platform-overview.pdf");
  console.log(`    → ${pdfUpload.publicId}`);
  console.log(`    → ${pdfUpload.secureUrl}`);
  console.log("");

  const manifestPath = path.join(process.cwd(), "src/lib/media-cloud.json");
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        cloudName,
        folder: MEDIA_FOLDER,
        uploadedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Wrote ${manifestPath}`);
  console.log(`Also set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${cloudName} on Vercel for overrides.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
