import Image from "next/image";

export const LOGO_WORDMARK = { width: 876, height: 382 } as const;
export const LOGO_MARK = { width: 1024, height: 1024 } as const;

type Tone = "light" | "dark";

/**
 * Local transparent brand assets. Served from /public so replacements
 * show immediately (Cloudinary copies can lag until `npm run media:upload`).
 */
export function BrandLogo({
  tone = "light",
  variant = "wordmark",
  priority = false,
  className,
}: {
  tone?: Tone;
  variant?: "wordmark" | "mark";
  priority?: boolean;
  className?: string;
}) {
  if (variant === "mark") {
    return (
      <Image
        src="/brand/logo-mark-on-light.png"
        alt=""
        width={LOGO_MARK.width}
        height={LOGO_MARK.height}
        className={className}
        priority={priority}
      />
    );
  }

  const src =
    tone === "dark" ? "/brand/logo-wordmark-on-dark.png" : "/brand/logo-wordmark.png";

  return (
    <Image
      src={src}
      alt=""
      width={LOGO_WORDMARK.width}
      height={LOGO_WORDMARK.height}
      className={className}
      priority={priority}
    />
  );
}
