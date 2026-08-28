import { landingCopy } from "./landing-translation";

export type PublishedAgeParts = {
  totalMinutes: number;
  days: number;
  hours: number;
  minutes: number;
  ageSeconds: number;
};

export function publishedAgeParts(date: Date, now = new Date()): PublishedAgeParts {
  const ageSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  const totalMinutes = Math.floor(ageSeconds / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { totalMinutes, days, hours, minutes, ageSeconds };
}

export function formatAbsolutePublishedAt(date: Date, lang: string) {
  return new Intl.DateTimeFormat(lang === "en" ? "en" : "ar", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuwait",
  }).format(date);
}

/** Human-readable age for feeds and API clients (minutes → hours → days). */
export function formatPublishedAge(date: Date, lang: string, now = new Date()) {
  const copy = landingCopy(lang === "en" ? "en" : "ar");
  const { totalMinutes, days, hours, minutes } = publishedAgeParts(date, now);

  if (totalMinutes < 1) return copy.relativeJustNow;
  if (totalMinutes < 60) return copy.relativeMinutes(minutes);
  if (days < 1) {
    if (minutes > 0) return copy.relativeHoursMinutes(hours, minutes);
    return copy.relativeHours(hours);
  }
  if (days < 7) return copy.relativeDays(days);
  return formatAbsolutePublishedAt(date, lang);
}
