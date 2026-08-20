import { v2 as cloudinary } from "cloudinary";

export type CloudinaryUploadResult = {
  publicId: string;
  url: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  resourceType: string;
};

let configured = false;

function parseCloudinaryUrl(value: string) {
  // cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  const match = value.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/]+)/);
  if (!match) return null;
  return {
    apiKey: match[1],
    apiSecret: match[2],
    cloudName: match[3],
  };
}

export function cloudinaryConfig() {
  const fromUrl = process.env.CLOUDINARY_URL
    ? parseCloudinaryUrl(process.env.CLOUDINARY_URL)
    : null;
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || fromUrl?.cloudName || "",
    apiKey: process.env.CLOUDINARY_API_KEY || fromUrl?.apiKey || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || fromUrl?.apiSecret || "",
  };
}

export function isCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  return Boolean(cloudName && apiKey && apiSecret);
}

export function ensureCloudinary() {
  if (configured) return;
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET.",
    );
  }
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

function toResult(raw: {
  public_id: string;
  url: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  resource_type?: string;
}): CloudinaryUploadResult {
  return {
    publicId: raw.public_id,
    url: raw.url,
    secureUrl: raw.secure_url,
    width: raw.width,
    height: raw.height,
    format: raw.format,
    bytes: raw.bytes,
    resourceType: raw.resource_type || "image",
  };
}

/** Upload a local buffer (console / API file uploads). */
export async function uploadImageBuffer(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    filename?: string;
  } = {},
): Promise<CloudinaryUploadResult> {
  ensureCloudinary();
  const folder = options.folder || "briefly-newsstream";
  const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: options.publicId,
        resource_type: "image",
        overwrite: false,
        unique_filename: !options.publicId,
        use_filename: Boolean(options.filename),
        filename_override: options.filename,
      },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(error || new Error("Cloudinary upload returned empty result"));
          return;
        }
        resolve(toResult(uploaded));
      },
    );
    stream.end(buffer);
  });
  return result;
}

/** Fetch a remote image and store it on Cloudinary (article mirroring). */
export async function uploadImageFromUrl(
  remoteUrl: string,
  options: { folder?: string; publicId?: string } = {},
): Promise<CloudinaryUploadResult> {
  ensureCloudinary();
  const uploaded = await cloudinary.uploader.upload(remoteUrl, {
    folder: options.folder || "briefly-newsstream/articles",
    public_id: options.publicId,
    resource_type: "image",
    overwrite: false,
    unique_filename: !options.publicId,
  });
  return toResult(uploaded);
}

export type OptimizeOptions = {
  width?: number;
  height?: number;
  quality?: string | number;
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  crop?: "fill" | "fit" | "limit" | "scale";
};

/** Build an optimized delivery URL for an already-uploaded Cloudinary asset. */
export function optimizedCloudinaryUrl(
  publicIdOrUrl: string,
  options: OptimizeOptions = {},
): string {
  ensureCloudinary();
  const publicId = publicIdFromCloudinaryUrl(publicIdOrUrl) || publicIdOrUrl;
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop || (options.width || options.height ? "limit" : undefined),
        quality: options.quality ?? "auto",
        fetch_format: options.format ?? "auto",
      },
    ],
  });
}

/**
 * Turn any http(s) image into a Cloudinary-optimized fetch URL without storing it.
 * Falls back to the original URL when Cloudinary is not configured.
 */
export function optimizedFetchUrl(
  remoteUrl: string | null | undefined,
  options: OptimizeOptions = {},
): string | null {
  if (!remoteUrl) return null;
  if (!isCloudinaryConfigured()) return remoteUrl;
  if (isCloudinaryHosted(remoteUrl)) {
    return optimizedCloudinaryUrl(remoteUrl, options);
  }
  try {
    ensureCloudinary();
    return cloudinary.url(remoteUrl, {
      type: "fetch",
      secure: true,
      sign_url: true,
      transformation: [
        {
          width: options.width ?? 1200,
          crop: options.crop || "limit",
          quality: options.quality ?? "auto",
          fetch_format: options.format ?? "auto",
        },
      ],
    });
  } catch {
    return remoteUrl;
  }
}

export function isCloudinaryHosted(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === "res.cloudinary.com" || host.endsWith(".cloudinary.com");
  } catch {
    return false;
  }
}

export function publicIdFromCloudinaryUrl(url: string): string | null {
  if (!url.includes("://") && !url.startsWith("http")) return url;
  try {
    const { pathname } = new URL(url);
    const marker = "/upload/";
    const idx = pathname.indexOf(marker);
    if (idx < 0) return null;
    let rest = pathname.slice(idx + marker.length);
    rest = rest.replace(/^v\d+\//, "");
    const parts = rest.split("/").filter(Boolean);
    const isTransformSegment = (seg: string) =>
      seg.includes(",") || /^(c|w|h|q|f|fl|e|g|ar|b|bo|r|dpr|so|eo)_/.test(seg);
    while (parts.length > 1 && isTransformSegment(parts[0])) {
      parts.shift();
    }
    const joined = parts.join("/");
    return joined.replace(/\.[a-zA-Z0-9]+$/, "") || null;
  } catch {
    return null;
  }
}

export { cloudinary };
