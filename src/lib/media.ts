/**
 * Static marketing / brand media on Cloudinary.
 * Public IDs are stable; upload via `npm run media:upload`.
 *
 * Delivery URLs use f_auto,q_auto (and optional width) so Cloudinary
 * serves modern formats (AVIF/WebP) without needing the API secret on the client.
 */

import mediaCloud from "./media-cloud.json";
import { publicSiteUrl } from "./site-url";

export const MEDIA_FOLDER = "briefly-newsstream/static";

/** Stable public IDs (without folder prefix when passed to upload with folder). */
export const MEDIA = {
  logoMark: `${MEDIA_FOLDER}/brand/logo-mark`,
  logoWordmark: `${MEDIA_FOLDER}/brand/logo-wordmark`,
  logoWordmarkOnDark: `${MEDIA_FOLDER}/brand/logo-wordmark-on-dark`,
  heroNewsstream: `${MEDIA_FOLDER}/hero/hero-newsstream`,
  heroMarkets: `${MEDIA_FOLDER}/hero/hero-markets`,
  ogShare: `${MEDIA_FOLDER}/og/og-share`,
  consoleGate: `${MEDIA_FOLDER}/console/console-gate`,
  conceptArFirstDesk: `${MEDIA_FOLDER}/concepts/concept-ar-first-desk`,
  conceptFloatingStream: `${MEDIA_FOLDER}/concepts/concept-floating-stream`,
  conceptBentoCoverage: `${MEDIA_FOLDER}/concepts/concept-bento-coverage`,
  conceptBilingualPro: `${MEDIA_FOLDER}/concepts/concept-bilingual-pro`,
  conceptStreamIcons: `${MEDIA_FOLDER}/concepts/concept-stream-icons`,
  /** Brief page fixed globe background — upload via `npm run media:upload`. */
  briefBackground: `${MEDIA_FOLDER}/marketing/bg-brief`,
} as const;

/** Cloudinary public id for the branded platform brief (raw PDF). */
export const PLATFORM_OVERVIEW_PDF_ID = `${MEDIA_FOLDER}/console/platform-overview`;

export type MediaKey = keyof typeof MEDIA;

export type MediaUrlOptions = {
  width?: number;
  height?: number;
  quality?: "auto" | number;
  /** Crop mode when width/height set. Default limit (no upscale crop). */
  crop?: "limit" | "fill" | "fit" | "scale";
};

/** Cloud name safe for browser + server (prefer public env, then committed manifest). */
export function publicCloudinaryCloudName(): string {
  return (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    mediaCloud.cloudName ||
    ""
  );
}

export function isPublicCloudinaryReady() {
  return Boolean(publicCloudinaryCloudName());
}

/**
 * Build an optimized Cloudinary delivery URL (no API secret required).
 * Falls back to local `/public` path when cloud name is missing (local offline).
 */
export function mediaUrl(
  key: MediaKey,
  options: MediaUrlOptions = {},
  fallbackPath?: string,
): string {
  const cloudName = publicCloudinaryCloudName();
  const publicId = MEDIA[key];
  if (!cloudName || key.startsWith("logo")) {
    return fallbackPath || localFallback(key);
  }

  const transforms: string[] = ["f_auto", `q_${options.quality ?? "auto"}`];
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.width || options.height) {
    transforms.push(`c_${options.crop || "limit"}`);
  }
  transforms.push("dpr_auto");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(",")}/${publicId}`;
}

/** Absolute URL for Open Graph / JSON-LD (always https). */
export function mediaAbsoluteUrl(key: MediaKey, options: MediaUrlOptions = {}): string {
  const url = mediaUrl(key, options);
  if (url.startsWith("http")) return url;
  const origin = publicSiteUrl();
  return `${origin.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

/** Archive URL. Console download uses the signed-in /api/console/platform-overview route. */
export function platformOverviewPdfUrl() {
  const cloudName = publicCloudinaryCloudName();
  if (!cloudName) return "/console/platform-overview.pdf";
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${PLATFORM_OVERVIEW_PDF_ID}.pdf`;
}

function localFallback(key: MediaKey): string {
  const map: Record<MediaKey, string> = {
    logoMark: "/brand/logo-mark.png",
    logoWordmark: "/brand/logo-wordmark.png",
    logoWordmarkOnDark: "/brand/logo-wordmark-on-dark.png",
    heroNewsstream: "/hero-newsstream.jpg",
    heroMarkets: "/hero-markets.png",
    ogShare: "/og/og-share.jpg",
    consoleGate: "/console-gate.png",
    conceptArFirstDesk: "/concepts/concept-ar-first-desk.jpg",
    conceptFloatingStream: "/concepts/concept-floating-stream.jpg",
    conceptBentoCoverage: "/concepts/concept-bento-coverage.jpg",
    conceptBilingualPro: "/concepts/concept-bilingual-pro.jpg",
    conceptStreamIcons: "/concepts/concept-stream-icons.jpg",
    briefBackground: "/marketing/bg-brief.png",
  };
  return map[key];
}

/** Responsive Cloudinary URLs for the brief page background (decorative, right-aligned globe). */
export function briefBackgroundSources() {
  const cloudName = publicCloudinaryCloudName();
  const publicId = MEDIA.briefBackground;
  const fallback = localFallback("briefBackground");

  if (!cloudName) {
    return {
      mobile: fallback,
      tablet: fallback,
      desktop: fallback,
      fallback,
    };
  }

  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
  return {
    /** Full width on phones — limit scale, moderate quality (≈115KB WebP). */
    mobile: `${base}/f_auto,q_60,w_640,c_limit,dpr_auto/${publicId}`,
    /** Crop to east (globe) on tablet+ — avoids shipping empty black pixels. */
    tablet: `${base}/f_auto,q_70,w_720,c_fill,g_east,dpr_auto/${publicId}`,
    desktop: `${base}/f_auto,q_75,w_960,c_fill,g_east,dpr_auto/${publicId}`,
    fallback,
  };
}

/** next/image loader that keeps transforms on Cloudinary (avoids double-processing). */
export function cloudinaryImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.includes("res.cloudinary.com")) {
    // Inject/replace width into existing transform segment when possible.
    try {
      const u = new URL(src);
      const parts = u.pathname.split("/upload/");
      if (parts.length === 2) {
        const [prefix, rest] = parts;
        const q = quality ? `q_${quality}` : "q_auto";
        const transform = `f_auto,${q},w_${width},c_limit,dpr_auto`;
        // rest may already include transforms; strip a prior transform-only first segment
        const restParts = rest.split("/");
        const first = restParts[0] || "";
        const hasTransform =
          first.includes(",") || /^(f_|q_|w_|h_|c_|dpr_)/.test(first);
        const assetPath = hasTransform ? restParts.slice(1).join("/") : rest;
        u.pathname = `${prefix}/upload/${transform}/${assetPath}`;
        return u.toString();
      }
    } catch {
      /* fall through */
    }
    return src;
  }
  return src.includes("?") ? `${src}&w=${width}` : `${src}?w=${width}`;
}
