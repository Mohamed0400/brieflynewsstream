import { BrandLoaderScreen } from "@/components/media/BrandLoader";
import { getConsoleLang } from "@/lib/console-lang";

export default async function ConsoleDashboardLoading() {
  const lang = await getConsoleLang();
  return (
    <BrandLoaderScreen
      label={lang === "en" ? "Loading" : "جارٍ التحميل"}
      tone="console"
    />
  );
}
