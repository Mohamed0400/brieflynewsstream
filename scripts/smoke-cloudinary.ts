/**
 * End-to-end Cloudinary smoke: upload a tiny PNG, verify optimized URL returns 200.
 *
 *   npx tsx scripts/smoke-cloudinary.ts
 */
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  isCloudinaryConfigured,
  optimizedCloudinaryUrl,
  uploadImageBuffer,
  uploadImageFromUrl,
} from "../src/lib/cloudinary";

/** 1x1 PNG */
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary env vars missing");
  }

  console.log("1) Uploading 1x1 PNG buffer…");
  const uploaded = await uploadImageBuffer(PNG_1X1, {
    folder: "briefly-newsstream/smoke",
    filename: "smoke-pixel.png",
  });
  console.log("   publicId:", uploaded.publicId);
  console.log("   secureUrl:", uploaded.secureUrl);

  const optimized = optimizedCloudinaryUrl(uploaded.publicId, {
    width: 64,
    quality: "auto",
    format: "auto",
  });
  console.log("2) Optimized URL:", optimized);

  const res = await fetch(optimized);
  if (!res.ok) {
    throw new Error(`Optimized delivery HTTP ${res.status}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  console.log(`   delivery OK (${res.status}, ${bytes.length} bytes, ${res.headers.get("content-type")})`);

  console.log("3) Re-upload same asset via URL (dedupe path)…");
  const mirrored = await uploadImageFromUrl(uploaded.secureUrl, {
    folder: "briefly-newsstream/smoke",
  });
  console.log("   mirrored:", mirrored.secureUrl);

  const tmp = path.join(tmpdir(), `cloudinary-smoke-${Date.now()}.png`);
  writeFileSync(tmp, PNG_1X1);
  unlinkSync(tmp);

  console.log("\nCloudinary smoke passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
