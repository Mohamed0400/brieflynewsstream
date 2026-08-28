import { briefBackgroundSources } from "@/lib/media";

/**
 * Hero-scoped globe glow on the right edge — does not repeat behind the feed.
 * Cloudinary f_auto + width caps keep AVIF/WebP delivery under ~150KB typical.
 */
export function BriefPageBackground() {
  const sources = briefBackgroundSources();

  return (
    <div className="mkt-brief-bg" aria-hidden="true">
      <picture className="mkt-brief-bg__picture">
        <source media="(min-width: 1024px)" srcSet={sources.desktop} />
        <source media="(min-width: 640px)" srcSet={sources.tablet} />
        <img
          className="mkt-brief-bg__img"
          src={sources.mobile}
          alt=""
          width={1599}
          height={984}
          decoding="async"
          fetchPriority="low"
          loading="lazy"
        />
      </picture>
    </div>
  );
}
