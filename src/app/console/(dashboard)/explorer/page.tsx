import type { Metadata } from "next";
import { ApiExplorer } from "@/components/console/ApiExplorer";
import { getOrCreateAccount, getSessionUser } from "@/lib/account";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";
import { CATEGORY_META, REGION_META } from "@/lib/market";
import { NATIONALITY_GROUPS, NATIONALITY_OPTIONS } from "@/lib/nationalities";
import { prisma } from "@/lib/prisma";
import { localizedCountryLabel, supportedCountryCodes } from "@/lib/supported-countries";

export async function generateMetadata(): Promise<Metadata> {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return { title: copy.explorer.title };
}

export const dynamic = "force-dynamic";

export default async function ConsoleExplorerPage() {
  const lang = await getConsoleLang();
  const copy = consoleDashboardCopy(lang);
  const user = await getSessionUser();
  const account = user?.email
    ? await getOrCreateAccount({ authUserId: user.id, email: user.email })
    : null;
  const accountKeys = account
    ? await prisma.apiKey.findMany({
        where: { accountId: account.id, revokedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, prefix: true, lastFour: true },
      })
    : [];
  const [countryRows, sourceRows] = await Promise.all([
    prisma.article.findMany({
      distinct: ["country"],
      select: { country: true },
      orderBy: { country: "asc" },
    }),
    prisma.source.findMany({
      where: { enabled: true },
      select: { code: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ApiExplorer
      accountKeys={accountKeys.map((key) => ({
        id: key.id,
        label: `${key.name} · ${key.prefix}…${key.lastFour}`,
      }))}
      categories={[
        { value: "", label: copy.explorer.allCategories },
        ...CATEGORY_META.map((item) => ({
          value: item.code,
          label: lang === "ar" ? item.labelAr : item.label,
        })),
      ]}
      countries={[
        { value: "", label: copy.explorer.allCountries },
        ...supportedCountryCodes(countryRows.map(({ country }) => country)).map((code) => ({
          value: code,
          label: localizedCountryLabel(code, lang),
        })),
      ]}
      regions={[
        { value: "", label: copy.explorer.allRegions },
        ...REGION_META.map((item) => ({
          value: item.code,
          label: lang === "ar" ? item.labelAr : item.label,
        })),
      ]}
      nationalities={[
        { value: "", label: copy.explorer.allNationalities },
        ...NATIONALITY_GROUPS.map((group) => ({
          value: group.code,
          label: group.code === "AFRICA" ? copy.explorer.africaGroup : group.label,
        })),
        ...NATIONALITY_OPTIONS.map((option) => ({
          value: option.code,
          label: lang === "ar"
            ? `${option.nationalityAr} (${option.nameAr})`
            : `${option.nationality} (${option.country})`,
        })),
      ]}
      sources={[
        { value: "", label: copy.explorer.allSources },
        ...sourceRows.map((source) => ({ value: source.code, label: source.name })),
      ]}
    />
  );
}
