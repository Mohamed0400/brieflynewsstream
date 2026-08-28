export function accountDisplayName(
  email: string,
  metadata?: Record<string, unknown> | null,
): string {
  const raw =
    (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata?.name === "string" && metadata.name.trim()) ||
    "";
  if (raw) return raw;

  const local = email.split("@")[0]?.trim() ?? email;
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
