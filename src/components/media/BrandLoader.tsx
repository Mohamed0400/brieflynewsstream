import Image from "next/image";

export const LOGO_MARK_ON_LIGHT = {
  src: "/brand/logo-mark-on-light.png",
  width: 1024,
  height: 1024,
} as const;

type Size = "sm" | "md" | "lg";

const PX: Record<Size, number> = {
  sm: 28,
  md: 88,
  lg: 220,
};

/**
 * Official mark on paper. White in the PNG is knocked out with multiply
 * so the loader never sits on a second white plate.
 */
export function BrandLoader({
  size = "md",
  label = "Loading",
  showLabel = false,
  decorative = false,
  className,
}: {
  size?: Size;
  label?: string;
  showLabel?: boolean;
  decorative?: boolean;
  className?: string;
}) {
  const px = PX[size];
  const stage = (
    <span className="bn-loader-stage" aria-hidden="true">
      <Image
        src={LOGO_MARK_ON_LIGHT.src}
        alt=""
        width={LOGO_MARK_ON_LIGHT.width}
        height={LOGO_MARK_ON_LIGHT.height}
        className="bn-loader-mark"
        priority={size === "lg"}
        sizes={`${px}px`}
      />
    </span>
  );

  if (decorative) {
    return (
      <div className={["bn-loader", `bn-loader--${size}`, className].filter(Boolean).join(" ")} aria-hidden="true">
        {stage}
      </div>
    );
  }

  return (
    <div
      className={["bn-loader", `bn-loader--${size}`, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-label={showLabel ? undefined : label}
    >
      {stage}
      {showLabel ? (
        <span className="bn-loader-caption">{label}</span>
      ) : (
        <span className="bn-loader-vh">{label}</span>
      )}
    </div>
  );
}

export function BrandLoaderScreen({
  label = "جارٍ التحميل",
  tone = "paper",
}: {
  label?: string;
  tone?: "paper" | "console";
}) {
  return (
    <div className={`bn-loader-page bn-loader-page--${tone}`} aria-busy="true">
      <BrandLoader size="lg" label={label} showLabel />
    </div>
  );
}
