"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import {
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
  freshnessHours,
}: {
  initialNationality: string;
  category?: string;
  country?: string;
  lang?: string;
  q?: string;
  sort?: string;
  from?: string;
  to?: string;
  freshnessHours: number;
}) {
  const router = useRouter();
  const isArabic = lang !== "en";
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
  const selected = optionForCode(nationality);
  const selectedGroup = NATIONALITY_GROUPS.find((group) => group.code === nationality);
  const selectedLabel = selected
    ? isArabic
      ? selected.nameAr
      : selected.country
    : selectedGroup?.label;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (lang && lang !== "ar") params.set("lang", lang);
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (country) params.set("country", country);
    if (sort && sort !== "date") params.set("sort", sort);
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
  if (sort && sort !== "date") clearParams.set("sort", sort);
  if (from) clearParams.set("from", from);
  if (to) clearParams.set("to", to);
  const clearHref = clearParams.toString() ? `/news?${clearParams}` : "/news";
  const actionLabel = pending
    ? (isArabic ? "جارٍ تحميل التغطية..." : "Loading briefing...")
    : selectedLabel
      ? isArabic
        ? `${normalizedInitial === nationality ? "تحديث" : "عرض"} تغطية ${selectedLabel}`
        : `${normalizedInitial === nationality ? "Refresh" : "View"} ${selectedLabel} briefing`
      : isArabic
        ? "عرض التغطية الحديثة"
        : "View latest briefing";

  return (
    <form onSubmit={submit} className="community-briefing-form">
      <label className="community-briefing-field" htmlFor="community-nationality">
        <span>{isArabic ? "تغطية الجاليات" : "Community briefing"}</span>
        <select
          id="community-nationality"
          name="nationality"
          value={nationality}
          onChange={(event) => setNationality(event.target.value)}
        >
          <option value="">{isArabic ? "كل الجاليات" : "All nationality audiences"}</option>
          {NATIONALITY_GROUPS.map((group) => (
            <option key={group.code} value={group.code}>
              {isArabic && group.code === "AFRICA" ? "الجاليات الأفريقية" : group.label}
            </option>
          ))}
          {NATIONALITY_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {isArabic
                ? `${option.nameAr} - ${option.nationalityAr}`
                : `${option.country} - ${option.nationality}`}
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
        {actionLabel}
      </button>
      {initialNationality && (
        <Link href={clearHref} className="community-briefing-clear" scroll={false}>
          {isArabic ? "مسح" : "Clear"}
        </Link>
      )}
      <span className="community-briefing-status" aria-live="polite">
        {selectedLabel
          ? isArabic
            ? `تم اختيار ${selectedLabel}. عمر الأخبار لا يتجاوز ${freshnessHours} ساعة.`
            : `${selectedLabel} selected. News is at most ${freshnessHours} hours old.`
          : isArabic
            ? `عمر الأخبار لا يتجاوز ${freshnessHours} ساعة.`
            : `News is at most ${freshnessHours} hours old.`}
      </span>
    </form>
  );
}
