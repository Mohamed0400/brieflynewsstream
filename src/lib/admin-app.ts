export const ADMIN_APP_PATH = "/consoleofbrieflynewsstreamapi";
export const ADMIN_OPERATIONS_PATH = `${ADMIN_APP_PATH}/operations`;
export const ADMIN_OVERVIEW_PATH = ADMIN_OPERATIONS_PATH;
export const ADMIN_ACCOUNTS_PATH = `${ADMIN_OPERATIONS_PATH}/accounts`;
export const ADMIN_SCHEDULE_PATH = `${ADMIN_OPERATIONS_PATH}/schedule`;
export const ADMIN_AUDIT_PATH = `${ADMIN_OPERATIONS_PATH}/audit`;
export const ADMIN_ANALYTICS_PATH = `${ADMIN_OPERATIONS_PATH}/analytics`;
export const ADMIN_SETTINGS_PATH = `${ADMIN_OPERATIONS_PATH}/settings`;

export function isAdminAppPath(pathname: string) {
  return pathname === ADMIN_APP_PATH || pathname.startsWith(`${ADMIN_APP_PATH}/`);
}

export function isCustomerConsolePath(pathname: string) {
  return pathname === "/console" || pathname.startsWith("/console/");
}

export function adminNavHref(path: string, lang: "ar" | "en") {
  return lang === "en" ? `${path}?lang=en` : path;
}
