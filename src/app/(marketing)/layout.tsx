import { Suspense } from "react";
import { MarketingShell } from "@/components/marketing/MarketingChrome";
import "../marketing.css";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense
      fallback={
        <div className="mkt">
          <main id="mkt-main" className="mkt-main">
            {children}
          </main>
        </div>
      }
    >
      <MarketingShell>
        <main id="mkt-main" className="mkt-main">
          {children}
        </main>
      </MarketingShell>
    </Suspense>
  );
}
