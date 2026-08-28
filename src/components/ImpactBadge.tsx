"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Eye, Flame, Minus, Pulse, X } from "@phosphor-icons/react";
import { landingCopy } from "@/lib/landing-translation";
import {
  impactTierFromArticle,
  marketImpactRows,
  type ArticleImpactScore,
  type ImpactTier,
} from "@/lib/impact-display";

const tierIcons: Record<ImpactTier, typeof Flame> = {
  high: Flame,
  moderate: Pulse,
  watch: Eye,
  low: Minus,
};

export function ImpactBadge({
  score,
  lang,
  className = "",
  feedVariant = false,
}: {
  score: ArticleImpactScore | null;
  lang: string;
  className?: string;
  feedVariant?: boolean;
}) {
  const copy = landingCopy(lang);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const noteId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!score) return null;

  const tier = impactTierFromArticle(score);
  const TierIcon = tierIcons[tier];
  const rows = marketImpactRows(score);
  const tierLabels = feedVariant ? copy.impactTierFeed : copy.impactTier;

  return (
    <>
      <button
        type="button"
        className={[
          "mkt-impact-badge",
          `mkt-impact-badge--${tier}`,
          feedVariant ? "mkt-impact-badge--feed" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={copy.impactBadgeOpen(tier)}
      >
        <span className="mkt-impact-badge-icon" aria-hidden="true">
          <TierIcon size={14} weight="fill" />
        </span>
        <span className="mkt-impact-badge-label">{tierLabels[tier]}</span>
      </button>

      {open ? (
        <div className="mkt-impact-modal-root" lang={copy.lang} dir={copy.dir}>
          <button
            type="button"
            className="mkt-impact-modal-backdrop"
            aria-label={copy.impactModalClose}
            onClick={() => setOpen(false)}
          />
          <div
            ref={dialogRef}
            className="mkt-impact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={noteId}
            tabIndex={-1}
          >
            <div className="mkt-impact-modal-head">
              <div>
                <p className="mkt-impact-modal-kicker">{copy.impactModalKicker}</p>
                <h3 id={titleId}>{copy.impactModalTitle}</h3>
              </div>
              <button
                type="button"
                className="mkt-impact-modal-close"
                aria-label={copy.impactModalClose}
                onClick={() => setOpen(false)}
              >
                <X size={16} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <ul className="mkt-impact-modal-markets">
              {rows.map((row) => (
                <li key={row.key}>
                  <div className="mkt-impact-modal-market-head">
                    <span>{copy.impactMarket[row.key]}</span>
                    <strong>{row.value}</strong>
                  </div>
                  <span className="mkt-impact-modal-track" aria-hidden="true">
                    <span
                      className={`mkt-impact-modal-fill mkt-impact-modal-fill--${row.key}`}
                      style={{ width: `${Math.max(0, Math.min(100, row.value))}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>

            <p id={noteId} className="mkt-impact-modal-note">
              {copy.impactModalNote}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
