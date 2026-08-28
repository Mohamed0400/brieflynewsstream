"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { landingCopy } from "@/lib/landing-translation";
import {
  nationalityAudienceLabel,
  nationalityGroupsForHost,
  nationalityOptionsForHost,
  NATIONALITY_GROUPS,
  NATIONALITY_OPTIONS,
  optionForCode,
} from "@/lib/nationalities";

export function CommunityBriefingFilter({
  initialNationality,
  category,
  country,
  lang,
  q,
  sort,
  from,
  to,
}: {
  initialNationality: string;
  category?: string;
  country?: string;
  lang?: string;
  q?: string;
  sort?: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const copy = landingCopy(lang === "en" ? "en" : "ar");
  const briefing = copy.communityBriefing;
  const normalizedInitial = (() => {
    const value = initialNationality.trim().toLowerCase();
    const group = NATIONALITY_GROUPS.find((item) => (
      item.code.toLowerCase() === value || item.slug.toLowerCase() === value
    ));
    if (group) return group.code;
    const option = NATIONALITY_OPTIONS.find((item) => (
      [item.code, item.slug, item.country, item.nationality, ...item.aliases]
        .some((candidate) => candidate.toLowerCase() === value)
    ));
    return option?.code ?? "";
  })();
  const [nationality, setNationality] = useState(normalizedInitial);
  const [pending, startTransition] = useTransition();
  const scopedOptions = useMemo(() => nationalityOptionsForHost(country), [country]);
  const scopedGroups = useMemo(() => nationalityGroupsForHost(country), [country]);
  const allowedCodes = useMemo(
    () => new Set(scopedOptions.map((option) => option.code)),
    [scopedOptions],
  );

  useEffect(() => {
    if (!nationality) return;
    const group = NATIONALITY_GROUPS.find((item) => item.code === nationality);
    if (group) {
      if (scopedGroups.some((item) => item.code === group.code)) return;
      setNationality("");
      return;
    }
    if (!allowedCodes.has(nationality)) setNationality("");
  }, [allowedCodes, country, nationality, scopedGroups]);

  const selected = optionForCode(nationality);
  const selectedGroup = scopedGroups.find((group) => group.code === nationality)
    ?? NATIONALITY_GROUPS.find((group) => group.code === nationality);
  const selectedLabel = selected
    ? nationalityAudienceLabel(selected, copy.lang)
    : selectedGroup
      ? (copy.lang === "ar" && selectedGroup.code === "AFRICA"
        ? briefing.africaGroup
        : selectedGroup.label)
      : null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (lang && lang !== "ar") params.set("lang", lang);
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (country) params.set("country", country);
    if (sort && sort !== "score") params.set("sort", sort);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (nationality) params.set("nationality", nationality);
    const query = params.toString();
    startTransition(() => router.replace(query ? `/news?${query}` : "/news", { scroll: false }));
  }

  const clearParams = new URLSearchParams();
  if (lang && lang !== "ar") clearParams.set("lang", lang);
  if (q) clearParams.set("q", q);
  if (category) clearParams.set("category", category);
  if (country) clearParams.set("country", country);
  if (sort && sort !== "score") clearParams.set("sort", sort);
  if (from) clearParams.set("from", from);
  if (to) clearParams.set("to", to);
  const clearHref = clearParams.toString() ? `/news?${clearParams}` : "/news";

  const statusText = selectedLabel
    ? country
      ? briefing.selectedInHost(selectedLabel, country)
      : selectedLabel
    : country
      ? briefing.pickCommunity
      : null;

  return (
    <form onSubmit={submit} className="community-briefing-form">
      <div
        className="mkt-hscroll-strip community-briefing-scroll"
        aria-label={briefing.label}
      >
        <div className="mkt-hscroll-strip__track community-briefing-controls">
          <label className="community-briefing-field" htmlFor="community-nationality">
            <span>{briefing.label}</span>
            {country && (
              <span className="community-briefing-hint">{briefing.hintHost(country)}</span>
            )}
            <select
              id="community-nationality"
              name="nationality"
              value={nationality}
              onChange={(event) => setNationality(event.target.value)}
            >
              <option value="">{briefing.all}</option>
              {scopedGroups.map((group) => (
                <option key={group.code} value={group.code}>
                  {copy.lang === "ar" && group.code === "AFRICA" ? briefing.africaGroup : group.label}
                </option>
              ))}
              {scopedOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {nationalityAudienceLabel(option, copy.lang)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="community-briefing-button"
            data-selected={nationality ? "true" : "false"}
          >
            {pending ? briefing.loading : briefing.show}
          </button>
          {initialNationality && (
            <Link href={clearHref} className="community-briefing-clear" scroll={false}>
              {briefing.clear}
            </Link>
          )}
        </div>
      </div>
      {statusText && (
        <span className="community-briefing-status" aria-live="polite">
          {statusText}
        </span>
      )}
    </form>
  );
}
