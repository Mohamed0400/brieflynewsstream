import { MarketingNotFound, MarketingShell } from "@/components/marketing/MarketingChrome";
import "./marketing.css";

export default function NotFound() {
  return (
    <div className="mkt" lang="ar" dir="rtl">
      <MarketingShell>
        <main id="mkt-main" className="mkt-main">
          <MarketingNotFound />
        </main>
      </MarketingShell>
    </div>
  );
}
