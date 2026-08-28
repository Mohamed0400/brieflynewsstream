import { Suspense } from "react";
import { MarketingShell } from "@/components/marketing/MarketingChrome";
import MarketingLoading from "./loading";
import { getPublicSiteSettings } from "@/lib/ops-settings";
import "../marketing.css";

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettings = await getPublicSiteSettings();

  return (
    <Suspense fallback={<MarketingLoading />}>
      <MarketingShell siteSettings={siteSettings}>
        <main id="mkt-main" className="mkt-main">
          {children}
        </main>
      </MarketingShell>
    </Suspense>
  );
}
