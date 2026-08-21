import { landingCopy } from "@/lib/landing-translation";

export function HomepageDataOverview({
  lang,
  countriesCovered,
}: {
  lang: "ar" | "en";
  countriesCovered: number;
}) {
  const copy = landingCopy(lang);
  const items = [
    {
      id: "window",
      value: copy.overviewWindowValue,
      title: copy.overviewWindowTitle,
      detail: copy.overviewWindowDetail,
    },
    {
      id: "countries",
      value: `${countriesCovered}+`,
      title: copy.overviewCountriesTitle,
      detail: copy.overviewCountriesDetail,
    },
    {
      id: "languages",
      value: copy.overviewLanguagesValue,
      title: copy.overviewLanguagesTitle,
      detail: copy.overviewLanguagesDetail,
    },
  ];

  return (
    <section
      className="homepage-overview"
      aria-labelledby="homepage-overview-title"
      dir={copy.dir}
      lang={copy.lang}
    >
      <h2 id="homepage-overview-title">{copy.overviewTitle}</h2>
      <ul className="homepage-overview-grid">
        {items.map((item) => (
          <li key={item.id} className="homepage-overview-card">
            <p className="homepage-overview-value">
              {item.value}
            </p>
            <h3>{item.title}</h3>
            <p className="homepage-overview-detail">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
