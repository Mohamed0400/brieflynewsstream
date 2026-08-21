"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useLayoutEffect, type ReactNode } from "react";
import {
  consoleDashboardCopy,
  persistConsoleLang,
  type ConsoleDashboardCopy,
  type ConsoleLang,
} from "@/lib/console-translation";

const ConsoleLangContext = createContext<{
  lang: ConsoleLang;
  copy: ConsoleDashboardCopy;
} | null>(null);

export function ConsoleLangProvider({
  lang,
  children,
}: {
  lang: ConsoleLang;
  children: ReactNode;
}) {
  return (
    <ConsoleLangContext.Provider value={{ lang, copy: consoleDashboardCopy(lang) }}>
      {children}
    </ConsoleLangContext.Provider>
  );
}

export function useConsoleCopy() {
  const value = useContext(ConsoleLangContext);
  if (!value) {
    throw new Error("useConsoleCopy must be used inside ConsoleLangProvider");
  }
  return value;
}

export function ConsoleAuthLangSync({ lang }: { lang: ConsoleLang }) {
  useEffect(() => {
    persistConsoleLang(lang);
  }, [lang]);
  return null;
}

export function ConsoleDocumentLang({
  lang,
  dir,
}: {
  lang: ConsoleLang;
  dir: "rtl" | "ltr";
}) {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const previousLang = html.lang;
    const previousDir = html.getAttribute("dir");
    html.lang = lang;
    html.dir = dir;
    html.dataset.consoleLang = lang;
    return () => {
      html.lang = previousLang;
      if (previousDir) html.setAttribute("dir", previousDir);
      else html.removeAttribute("dir");
      delete html.dataset.consoleLang;
    };
  }, [lang, dir]);
  return null;
}

export function ConsoleLangSwitcher({
  lang,
  login = false,
  basePath = "/console/login",
}: {
  lang: ConsoleLang;
  login?: boolean;
  basePath?: string;
}) {
  const router = useRouter();
  const label = lang === "en" ? "Language" : "اللغة";

  function select(next: ConsoleLang) {
    persistConsoleLang(next);
    if (!login) router.refresh();
  }

  if (login) {
    return (
      <nav className="console-gate-lang" aria-label={label}>
        <Link
          href={basePath}
          className={lang === "ar" ? "is-active" : ""}
          hrefLang="ar"
          lang="ar"
          aria-current={lang === "ar" ? "page" : undefined}
          onClick={() => persistConsoleLang("ar")}
        >
          العربية
        </Link>
        <Link
          href={`${basePath}?lang=en`}
          className={lang === "en" ? "is-active" : ""}
          hrefLang="en"
          lang="en"
          aria-current={lang === "en" ? "page" : undefined}
          onClick={() => persistConsoleLang("en")}
        >
          English
        </Link>
      </nav>
    );
  }

  return (
    <div className="console-lang-switch" role="group" aria-label={label}>
      <button
        type="button"
        lang="ar"
        aria-current={lang === "ar" ? "true" : undefined}
        onClick={() => select("ar")}
      >
        العربية
      </button>
      <button
        type="button"
        lang="en"
        aria-current={lang === "en" ? "true" : undefined}
        onClick={() => select("en")}
      >
        English
      </button>
    </div>
  );
}
