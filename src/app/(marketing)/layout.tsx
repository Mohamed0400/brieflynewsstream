import { MarketingShell } from "@/components/marketing/MarketingChrome";
import "../marketing.css";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mkt" lang="ar" dir="rtl">
      <MarketingShell>
        <main id="mkt-main" className="mkt-main">
          {children}
        </main>
      </MarketingShell>
    </div>
  );
}
