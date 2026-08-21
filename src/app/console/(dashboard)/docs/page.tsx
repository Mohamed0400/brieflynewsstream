import type { Metadata } from "next";
import Link from "next/link";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";

export async function generateMetadata(): Promise<Metadata> {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return { title: copy.docs.title };
}

const endpointGroups = {
  en: [
    {
      title: "Market feeds",
      items: [
        ["GET", "/api/v1/market-news", "Supports homepage filters, Arabic and English multi-word search, country, region, category, nationality, sorting, date range, and pagination."],
        ["GET", "/api/v1/market-news/today", "Returns today's stored daily edition after a collect or publish run."],
        ["GET", "/api/v1/market-news/nationality?nationality=IN", "Returns a current community briefing."],
      ],
    },
    {
      title: "Discovery",
      items: [
        ["GET", "/api/v1/market-news/editions", "List published daily editions."],
        ["GET", "/api/v1/meta/categories", "List supported market categories."],
        ["GET", "/api/v1/meta/nationalities", "List nationality audiences and fresh coverage counts."],
      ],
    },
  ],
  ar: [
    {
      title: "موجزات السوق",
      items: [
        ["GET", "/api/v1/market-news", "يدعم فلاتر الصفحة، البحث متعدد الكلمات بالعربية والإنجليزية، الدولة، المنطقة، التصنيف، الجالية، الترتيب، التاريخ، والصفحات."],
        ["GET", "/api/v1/market-news/today", "يعيد موجز اليوم المخزن بعد تشغيل الجمع أو النشر."],
        ["GET", "/api/v1/market-news/nationality?nationality=IN", "يعيد إحاطة الجالية الحالية."],
      ],
    },
    {
      title: "الاكتشاف",
      items: [
        ["GET", "/api/v1/market-news/editions", "قائمة الإصدارات اليومية المنشورة."],
        ["GET", "/api/v1/meta/categories", "قائمة تصنيفات السوق المدعومة."],
        ["GET", "/api/v1/meta/nationalities", "قائمة جماهير الجاليات وعداد التغطية الحديثة."],
      ],
    },
  ],
} as const;

const filterRows = {
  en: [
    ["Search", "`q=` with Arabic or English, including multi-word phrases like `أسعار النفط` or `oil prices`."],
    ["Search area", "`searchIn=title|summary|both`."],
    ["Country and region", "`country=AE`, `country=US`, `region=middle_east`, `region=america`, `region=global`."],
    ["Category", "`category=finance`, `oil`, `commodities`, `markets`, and the other catalog codes."],
    ["Nationality audience", "`nationality=IN` or any supported slug or ISO code."],
    ["Language filter", "`language=ar` or `language=en` filters by the article's stored source language."],
    ["Response language", "`lang=ar` (default) or `lang=en` chooses `title` and `summary`. `arabic` and `english` stay on every story."],
    ["Date filters", "`date=YYYY-MM-DD` or `from=YYYY-MM-DD&to=YYYY-MM-DD`."],
    ["Sorting", "`sort=score` for market impact or `sort=date` for newest first."],
    ["Pagination", "`limit=` and `offset=`."],
    ["Request limits", "API access is currently available without usage caps in this console."],
  ],
  ar: [
    ["البحث", "`q=` بالعربية أو الإنجليزية، بما في ذلك عبارات مثل `أسعار النفط` أو `oil prices`."],
    ["مجال البحث", "`searchIn=title|summary|both`."],
    ["الدولة والمنطقة", "`country=AE`، `country=US`، `region=middle_east`، `region=america`، `region=global`."],
    ["التصنيف", "`category=finance`، `oil`، `commodities`، `markets`، وبقية رموز الكتالوج."],
    ["جمهور الجالية", "`nationality=IN` أو أي رمز أو معرف مدعوم."],
    ["فلتر اللغة", "`language=ar` أو `language=en` يصفي حسب لغة المصدر المخزنة."],
    ["لغة الاستجابة", "`lang=ar` (الافتراضي) أو `lang=en` يختار `title` و`summary`. `arabic` و`english` يبقيان في كل خبر."],
    ["فلاتر التاريخ", "`date=YYYY-MM-DD` أو `from=YYYY-MM-DD&to=YYYY-MM-DD`."],
    ["الترتيب", "`sort=score` لأثر السوق أو `sort=date` للأحدث أولا."],
    ["الصفحات", "`limit=` و `offset=`."],
    ["حدود الطلب", "الوصول إلى الواجهة بلا سقف استخدام في هذه اللوحة حاليا."],
  ],
} as const;

export default async function ConsoleDocsPage() {
  const lang = await getConsoleLang();
  const copy = consoleDashboardCopy(lang);
  const groups = endpointGroups[lang];
  const filters = filterRows[lang];

  return (
    <div className="console-page">
      <header className="console-page-header">
        <p className="console-kicker">{copy.docs.kicker}</p>
        <h1>{copy.docs.heading}</h1>
        <p className="console-page-description">
          {copy.docs.descriptionBefore}{" "}
          <Link href="/console/docs/api">{copy.docs.apiDocsLink}</Link>{" "}
          {copy.docs.descriptionAfter}
        </p>
      </header>

      <section className="console-panel" aria-labelledby="curl-heading">
        <div className="console-panel-heading">
          <div>
            <h2 id="curl-heading">{copy.docs.example}</h2>
            <p>{copy.docs.exampleHint}</p>
          </div>
        </div>
        <pre className="console-code-block" dir="ltr"><code>{`curl "http://localhost:3001/api/v1/market-news?q=%D8%B0%D9%87%D8%A8&lang=ar&country=KW&limit=20" \\
  -H "X-API-Key: mna_test_your_key_here"`}</code></pre>
      </section>

      <section className="console-panel" aria-labelledby="filters-heading">
        <div className="console-panel-heading">
          <div>
            <h2 id="filters-heading">{copy.docs.filters}</h2>
            <p>{copy.docs.filtersHint}</p>
          </div>
        </div>
        <div className="console-doc-endpoints">
          {filters.map(([label, description]) => (
            <div key={label} className="console-doc-endpoint">
              <span>{label}</span>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="console-doc-grid" aria-label={copy.docs.endpointsAria}>
        {groups.map((group) => (
          <article key={group.title} className="console-panel">
            <div className="console-panel-heading">
              <div><h2>{group.title}</h2></div>
            </div>
            <div className="console-doc-endpoints">
              {group.items.map(([method, path, description]) => (
                <div key={path} className="console-doc-endpoint">
                  <span>{method}</span>
                  <code>{path}</code>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <aside className="console-policy-note">
        <strong>{copy.docs.policy}</strong>
        <p>{copy.docs.policyBody}</p>
      </aside>
    </div>
  );
}
