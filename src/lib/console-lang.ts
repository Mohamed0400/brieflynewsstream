import { cookies } from "next/headers";
import { CONSOLE_LANG_COOKIE, consoleLoginLang, type ConsoleLang } from "@/lib/console-translation";

export async function getConsoleLang(): Promise<ConsoleLang> {
  const value = (await cookies()).get(CONSOLE_LANG_COOKIE)?.value;
  return consoleLoginLang(value);
}

export async function getConsoleLoginLang(searchLang?: string): Promise<ConsoleLang> {
  if (searchLang === "en" || searchLang === "ar") return searchLang;
  return getConsoleLang();
}
