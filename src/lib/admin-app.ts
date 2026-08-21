export const ADMIN_APP_PATH = "/consoleofbrieflynewsstreamapi";
export const ADMIN_OPERATIONS_PATH = `${ADMIN_APP_PATH}/operations`;
export const ADMIN_SCHEDULE_PATH = `${ADMIN_OPERATIONS_PATH}/schedule`;

export function isAdminAppPath(pathname: string) {
  return pathname === ADMIN_APP_PATH || pathname.startsWith(`${ADMIN_APP_PATH}/`);
}

export function isCustomerConsolePath(pathname: string) {
  return pathname === "/console" || pathname.startsWith("/console/");
}
