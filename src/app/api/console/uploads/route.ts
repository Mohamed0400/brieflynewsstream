import { NextResponse } from "next/server";
import {
  isConsoleAuthenticated,
  isTrustedConsoleOrigin,
} from "@/lib/console-auth";
import {
  isCloudinaryConfigured,
  optimizedCloudinaryUrl,
  uploadImageBuffer,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function POST(request: Request) {
  if (!isTrustedConsoleOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  if (!(await isConsoleAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error: "cloudinary_not_configured",
        message: "Set CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).",
      },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "missing_file", message: "Send multipart field `file`." },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: "unsupported_type",
        message: "Only JPEG, PNG, WebP, GIF, and AVIF images are allowed.",
      },
      { status: 400 },
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "invalid_size", message: "Image must be between 1 byte and 5 MB." },
      { status: 400 },
    );
  }

  const folderRaw = form.get("folder");
  const folder =
    typeof folderRaw === "string" && /^[a-z0-9/_-]{1,80}$/i.test(folderRaw)
      ? folderRaw
      : "briefly-newsstream/uploads";

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const uploaded = await uploadImageBuffer(buffer, {
      folder,
      filename: file.name || undefined,
    });
    const optimized = optimizedCloudinaryUrl(uploaded.publicId, {
      width: 1600,
      quality: "auto",
      format: "auto",
    });
    return NextResponse.json(
      {
        ok: true,
        item: {
          publicId: uploaded.publicId,
          url: uploaded.secureUrl,
          optimizedUrl: optimized,
          width: uploaded.width ?? null,
          height: uploaded.height ?? null,
          format: uploaded.format ?? null,
          bytes: uploaded.bytes ?? null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Cloudinary upload failed", error);
    return NextResponse.json(
      { error: "upload_failed", message: "Cloudinary rejected the upload." },
      { status: 502 },
    );
  }
}
