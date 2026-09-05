/**
 * Collect kill switches for Free-plan egress protection.
 *
 * Ops priority when approaching / hitting egress quota:
 * 1. Pause MAIN collect first (MAIN_COLLECT_ENABLED=false)
 * 2. Keep Arabic collect running (highest product priority)
 * 3. Only pause Arabic (ARABIC_COLLECT_ENABLED=false) as last resort
 */

function flagOn(name: string): boolean | null {
  const flag = process.env[name]?.trim().toLowerCase();
  if (flag === undefined || flag === "") return null;
  if (flag === "false" || flag === "0" || flag === "off") return false;
  if (flag === "true" || flag === "1" || flag === "on") return true;
  return null;
}

/**
 * Main (bilingual / all-country) collect.
 * Default: enabled unless explicitly disabled.
 * GHA can set MAIN_COLLECT_ENABLED=false to pause without disabling Arabic.
 */
export function isMainCollectEnabled(): boolean {
  const flag = flagOn("MAIN_COLLECT_ENABLED");
  if (flag === false) return false;
  if (flag === true) return true;
  // Force flag alone does not override an explicit off — only enables when unset.
  return true;
}

/**
 * Arabic-only collect. Highest priority desk.
 * Default: off locally; GHA sets ARABIC_COLLECT_ENABLED=true.
 * ARABIC_COLLECT_FORCE also enables (used by force CLI runs).
 */
export function isArabicCollectEnabled(): boolean {
  const flag = flagOn("ARABIC_COLLECT_ENABLED");
  if (flag === false) return false;
  if (flag === true) return true;
  return Boolean(process.env.ARABIC_COLLECT_FORCE);
}
