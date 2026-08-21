import { CloudinaryImage } from "@/components/media/CloudinaryImage";
import { landingCopy } from "@/lib/landing-translation";

export function HomepageHero({ lang }: { lang: string }) {
  const copy = landingCopy(lang);
  const alt = lang === "en"
    ? "A globe in front of a rising market chart"
    : "كرة أرضية أمام مخطط أسواق مالية";

  return (
    <section className="homepage-hero" aria-labelledby="homepage-hero-title">
      <div className="homepage-hero-media">
        <CloudinaryImage
          media="heroMarkets"
          alt={alt}
          fill
          priority
          deliveryWidth={1920}
          sizes="100vw"
          className="homepage-hero-image"
        />
      </div>
      <div className="homepage-hero-scrim" aria-hidden="true" />
      <div className="homepage-hero-frame" dir="ltr">
        <div className="homepage-hero-copy" dir={copy.dir} lang={copy.lang}>
          <h1 id="homepage-hero-title">{copy.heroTitle}</h1>
          <p className="homepage-hero-lede">{copy.heroLede}</p>
          <p className="homepage-hero-body">{copy.heroBody}</p>
        </div>
      </div>
    </section>
  );
}
