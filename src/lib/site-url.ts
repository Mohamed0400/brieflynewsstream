export function publicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:3000";
}
