import Link from "next/link";
import Image from "next/image";
import { Clock, Globe, Pulse, Translate } from "@phosphor-icons/react/ssr";
import { landingCopy } from "@/lib/landing-translation";
import { newsFeedHref } from "@/lib/feed-view";

const iconProps = { size: 22, weight: "regular" as const, "aria-hidden": true };

export function BriefHero({
  lang,
  editionItemCount,
  countriesCovered,
  lastUpdated,
}: {
  lang: "ar" | "en";
  editionItemCount: number;
  countriesCovered: number;
  lastUpdated: string | null;
}) {
  const copy = landingCopy(lang);
  const updatedLabel = lastUpdated
    ? copy.liveUpdated(lastUpdated)
    : copy.liveUpdated(
        new Intl.DateTimeFormat(lang === "en" ? "en" : "ar", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Kuwait",
        }).format(new Date()),
      );

  return (
    <header className="mkt-brief-hero" dir={copy.dir} lang={copy.lang}>
      <div className="mkt-brief-hero__globe" aria-hidden="true">
        <Image
          src="/marketing/dot-world.webp"
          alt=""
          width={640}
          height={640}
          priority
          className="mkt-brief-hero__globe-img"
        />
      </div>

      <div className="mkt-brief-hero__copy">
        <p className="mkt-brief-live-badge">
          <span className="mkt-brief-live-badge__dot" aria-hidden="true" />
          {updatedLabel}
        </p>
        <h1>{copy.heroTitle}</h1>
        <p className="mkt-brief-hero__lede" data-aeo-answer>
          {copy.heroLede}
        </p>
        <ul className="mkt-brief-quick-info" aria-label={copy.overviewTitle}>
          <li>
            <Clock {...iconProps} />
            <span>
              <strong>{copy.quickWindowValue}</strong>
              {copy.quickWindowLabel}
            </span>
          </li>
          <li>
            <Globe {...iconProps} />
            <span>
              <strong>{countriesCovered.toLocaleString("en")}+</strong>
              {copy.quickCountriesSubLabel}
            </span>
          </li>
          <li>
            <Translate {...iconProps} />
            <span>
              <strong>{copy.quickLanguagesValue}</strong>
              {copy.quickLanguagesLabel}
            </span>
          </li>
        </ul>
      </div>

      <aside className="mkt-brief-pulse-card" aria-label={copy.marketPulse}>
        <div className="mkt-brief-pulse-card__head">
          <Pulse size={20} weight="fill" aria-hidden="true" />
          <span>{copy.marketPulse}</span>
        </div>
        <p className="mkt-brief-pulse-card__count">{editionItemCount.toLocaleString("en")}</p>
        <p className="mkt-brief-pulse-card__label">
          {editionItemCount === 1 ? copy.storyMattersToday : copy.storiesMatterToday}
        </p>
        <Link
          href={newsFeedHref({ lang, view: "top", hash: "#homepage-feed" })}
          className="mkt-brief-pulse-card__link"
        >
          {copy.seeTopStories}
        </Link>
      </aside>
    </header>
  );
}
