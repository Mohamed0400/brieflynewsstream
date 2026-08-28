export type FeedViewMode = "top" | "all";

export function isTopEditionFeedView(params: {
  view?: string;
  q?: string;
  category?: string;
  country?: string;
  nationality?: string;
  sort?: string;
  from?: string;
  to?: string;
}) {
  if (params.view === "all") return false;
  if (params.view === "top") return true;
  return !params.q
    && !params.category
    && !params.country
    && !params.nationality
    && params.sort !== "date"
    && !params.from
    && !params.to;
}

export function newsFeedHref(params: {
  lang?: string;
  q?: string;
  category?: string;
  country?: string;
  nationality?: string;
  sort?: string;
  from?: string;
  to?: string;
  page?: number;
  view?: FeedViewMode;
  hash?: string;
}) {
  const query = new URLSearchParams();
  if (params.lang && params.lang !== "ar") query.set("lang", params.lang);
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.country) query.set("country", params.country);
  if (params.nationality) query.set("nationality", params.nationality);
  if (params.sort && params.sort !== "score") query.set("sort", params.sort);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.view === "top") query.set("view", "top");
  if (params.view === "all") query.set("view", "all");
  const value = query.toString();
  const path = value ? `/news?${value}` : "/news";
  return params.hash ? `${path}${params.hash}` : path;
}
