import type { Icon } from "@phosphor-icons/react";
import { ChartBar, Clock, Globe, Translate } from "@phosphor-icons/react/ssr";
import { landingCopy } from "@/lib/landing-translation";

const pillIcons: Record<string, Icon> = {
  bilingual: Translate,
  window: Clock,
  ranked: ChartBar,
  coverage: Globe,
};

export function BriefTrustPills({ lang }: { lang: "ar" | "en" }) {
  const copy = landingCopy(lang);

  return (
    <ul
      className="mkt-brief-trust-pills"
      aria-label={copy.trustStripLabel}
      dir={copy.dir}
      lang={copy.lang}
    >
      {copy.trustItems.map((item, index) => {
        const IconComponent = pillIcons[item.id] ?? Globe;
        return (
          <li
            key={item.id}
            className={`mkt-brief-trust-pill${index === 0 ? " is-active" : ""}`}
          >
            <IconComponent size={16} weight="regular" aria-hidden="true" />
            {item.label}
          </li>
        );
      })}
    </ul>
  );
}
