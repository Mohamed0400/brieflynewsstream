export const GUIDES = [
  {
    slug: "what-is-a-market-intelligence-api",
    titleEn: "What is a market intelligence API?",
    titleAr: "ما هي واجهة ذكاء الأسواق؟",
    ledeEn:
      "A market intelligence API delivers structured market news with impact scores and bilingual fields so products can decide which stories matter.",
    ledeAr:
      "واجهة ذكاء الأسواق تقدّم أخبار أسواق منظمة بدرجات أثر وحقول ثنائية اللغة حتى تقرر المنتجات أي خبر يستحق الانتباه.",
    sectionsEn: [
      {
        h: "Definition",
        p: "A market intelligence API is a developer endpoint that returns market news as structured JSON: titles, summaries, countries, categories, and impact scores. It is built for products, not for reading a website.",
      },
      {
        h: "How it differs from a headline dump",
        p: "Other news API providers often optimize for volume. A market intelligence API optimizes for decisioning: which story affects rates, oil, metals, or the dollar enough to surface in a trading, media, or AI product.",
      },
      {
        h: "What Briefly ships today",
        p: "Briefly NewsStream returns bilingual Arabic and English fields, country and category filters across 100+ markets, and market-impact scores. Event detection and asset mapping remain on the roadmap.",
      },
    ],
    sectionsAr: [
      {
        h: "التعريف",
        p: "واجهة ذكاء الأسواق نقطة نهاية للمطوّرين تعيد أخبار الأسواق بصيغة JSON منظمة: عناوين وملخصات ودول وفئات ودرجات أثر. وهي مبنية للمنتجات لا لقراءة موقع.",
      },
      {
        h: "كيف تختلف عن سيل العناوين",
        p: "واجهات الأخبار الأخرى غالباً تحسّن الحجم. واجهة ذكاء الأسواق تحسّن القرار: أي خبر يؤثر على الفائدة أو النفط أو المعادن أو الدولار بما يكفي ليظهر في منتج تداول أو إعلام أو ذكاء اصطناعي.",
      },
      {
        h: "ما توفّره Briefly اليوم",
        p: "Briefly NewsStream يعيد حقولاً عربية وإنجليزية وفلاتر دولة وفئة عبر أكثر من 100 سوق ودرجات أثر. اكتشاف الأحداث وربط الأصول ما زالا على خارطة الطريق.",
      },
    ],
  },
  {
    slug: "bilingual-mena-market-news-for-products",
    titleEn: "Bilingual MENA market news for products",
    titleAr: "أخبار أسواق الشرق الأوسط ثنائية اللغة للمنتجات",
    ledeEn:
      "How Arabic-first bilingual market feeds help fintech and media products serve MENA and Gulf desks from one JSON schema.",
    ledeAr:
      "كيف تساعد موجزات الأسواق الثنائية اللغة والعربية أولاً منتجات التقنية المالية والإعلام على خدمة مكاتب الشرق الأوسط والخليج من مخطط JSON واحد.",
    sectionsEn: [
      {
        h: "Why bilingual fields matter",
        p: "MENA and Gulf products often need Arabic as the default language and English for global teams. Shipping both on every story avoids a second translation pipeline inside your app.",
      },
      {
        h: "Country filters for regional desks",
        p: "Filter by ISO codes such as SA, AE, EG, QA, or by region middle_east. The same schema works for Europe and Americas filters when you expand coverage.",
      },
      {
        h: "Product pattern",
        p: "Call the API with lang=ar or lang=en for title and summary, then keep arabic and english objects for dual UI panes or agent context.",
      },
    ],
    sectionsAr: [
      {
        h: "لماذا تهم الحقول الثنائية اللغة",
        p: "منتجات الشرق الأوسط والخليج غالباً تحتاج العربية افتراضياً والإنجليزية للفرق العالمية. شحن اللغتين في كل خبر يجنّب مسار ترجمة ثانياً داخل تطبيقك.",
      },
      {
        h: "فلاتر الدولة للمكاتب الإقليمية",
        p: "صفِّ بأكواد ISO مثل SA وAE وEG وQA أو بالمنطقة middle_east. المخطط نفسه يعمل لفلاتر أوروبا والأمريكتين عند توسيع التغطية.",
      },
      {
        h: "نمط المنتج",
        p: "استدعِ الواجهة بـ lang=ar أو lang=en للعنوان والملخص، واحتفظ بكائني arabic وenglish لواجهات مزدوجة أو سياق الوكلاء.",
      },
    ],
  },
  {
    slug: "impact-scoring-for-market-news-feeds",
    titleEn: "Impact scoring for market news feeds",
    titleAr: "درجات الأثر لموجزات أخبار الأسواق",
    ledeEn:
      "Why ranking market news by rates, oil, metals, and dollar impact beats newest-first alone for product surfaces.",
    ledeAr:
      "لماذا يتفوق ترتيب أخبار الأسواق حسب أثر الفائدة والنفط والمعادن والدولار على الأحدث أولاً وحده في واجهات المنتجات.",
    sectionsEn: [
      {
        h: "The product problem",
        p: "Newest-first feeds bury slow-moving but high-impact stories. Desks and agents need a score that reflects market relevance, not only publish time.",
      },
      {
        h: "What the scores represent",
        p: "Briefly attaches impact dimensions such as rates, oil, metals, dollar, and overall market impact so clients can sort=score or threshold alerts.",
      },
      {
        h: "How to use them",
        p: "Surface high-impact items in hero modules, agent digests, or push rules. Keep chronology available with sort=date for archive research.",
      },
    ],
    sectionsAr: [
      {
        h: "مشكلة المنتج",
        p: "الموجزات بالأحدث أولاً تطمر أخباراً بطيئة لكنها عالية الأثر. المكاتب والوكلاء يحتاجون درجة تعكس أهمية السوق لا وقت النشر فقط.",
      },
      {
        h: "ماذا تمثّل الدرجات",
        p: "Briefly يرفق أبعاد أثر مثل الفائدة والنفط والمعادن والدولار وأثر السوق الإجمالي حتى يرتّب العميل بـ sort=score أو يضبط تنبيهات.",
      },
      {
        h: "كيف تستخدمها",
        p: "اعرض العناصر عالية الأثر في الوحدات الرئيسية أو موجزات الوكلاء أو قواعد الدفع. أبقِ الترتيب الزمني متاحاً بـ sort=date لبحث الأرشيف.",
      },
    ],
  },
] as const;

export type GuideSlug = (typeof GUIDES)[number]["slug"];

export function guideBySlug(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}
