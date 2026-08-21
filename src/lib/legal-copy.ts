import type { MarketingLang } from "@/lib/marketing-copy";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalPageCopy = {
  title: string;
  lede: string;
  updated: string;
  sections: LegalSection[];
};

const copy: Record<MarketingLang, { privacy: LegalPageCopy; terms: LegalPageCopy }> = {
  en: {
    privacy: {
      title: "Privacy",
      lede: "How Briefly NewsStream handles account data, API usage, and public news sources.",
      updated: "Last updated 21 August 2026",
      sections: [
        {
          title: "What this product is",
          paragraphs: [
            "Briefly NewsStream is a bilingual market-news API and developer console. Public pages and the briefing are available without an account. Console features require an email and password.",
          ],
        },
        {
          title: "What we collect",
          paragraphs: [
            "Console accounts store the email you register with, a hashed password, API keys you create, plan status, and request counts used to enforce daily limits.",
            "We log enough operational data to run the service, debug failures, and apply the Free (5 requests a day) and Pro (20,000 requests a day) limits. We do not collect phone numbers and we do not offer Google sign-in.",
          ],
        },
        {
          title: "News content",
          paragraphs: [
            "Indexed headlines and summaries are drawn from publicly available publisher material. That content remains the publisher's. We keep an index so the API can return structured Arabic and English fields.",
          ],
        },
        {
          title: "Cookies and sessions",
          paragraphs: [
            "Signed-in console sessions use cookies so you stay logged in. Marketing pages do not require an account cookie. Language on public pages is a URL parameter (`lang=en`), not a tracking profile.",
          ],
        },
        {
          title: "What we do not do",
          paragraphs: [
            "We do not sell personal account data. We do not use your console email for a marketing drip unless you wrote to us and asked for a reply.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "Questions about stored account data: hello@brieflynewsstream.com.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms",
      lede: "Fair use of the Briefly NewsStream API, console, and public briefing.",
      updated: "Last updated 21 August 2026",
      sections: [
        {
          title: "The service",
          paragraphs: [
            "Briefly NewsStream provides structured market news (Arabic and English fields, impact scores, country and category filters) through a JSON API, a public briefing, and a developer console.",
          ],
        },
        {
          title: "Accounts and keys",
          paragraphs: [
            "You are responsible for the API keys on your account. Do not share secret keys in public client code. If a key leaks, revoke it in the console and create a new one.",
          ],
        },
        {
          title: "Plans and limits",
          paragraphs: [
            "Free includes 5 API requests a day and 2 keys. Pro is listed at $70 per month with 20,000 requests a day and 10 keys. Enterprise is custom. Request Pro from Billing. Payment is not live in the console yet.",
          ],
        },
        {
          title: "Source content",
          paragraphs: [
            "Articles in the feed are collected from third-party publishers. Use the API to power products, not to republish full publisher pages as if they were yours. Follow the source site's terms when you open the original URL.",
          ],
        },
        {
          title: "Availability",
          paragraphs: [
            "We run collection and publish jobs on a schedule. We do not claim a numbered uptime SLA. If the service is interrupted, try again or email hello@brieflynewsstream.com.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "hello@brieflynewsstream.com",
          ],
        },
      ],
    },
  },
  ar: {
    privacy: {
      title: "الخصوصية",
      lede: "كيف تتعامل Briefly NewsStream مع بيانات الحساب واستخدام الواجهة ومصادر الأخبار العامة.",
      updated: "آخر تحديث: 21 أغسطس 2026",
      sections: [
        {
          title: "ما هذا المنتج",
          paragraphs: [
            "Briefly NewsStream واجهة برمجة لأخبار الأسواق ثنائية اللغة ولوحة مطوّر. الصفحات العامة والموجز متاحان دون حساب. ميزات اللوحة تتطلب بريداً وكلمة مرور.",
          ],
        },
        {
          title: "ما نجمعه",
          paragraphs: [
            "حسابات اللوحة تخزّن البريد الذي تسجّل به، وكلمة مرور مشفّرة، ومفاتيح API التي تنشئها، وحالة الخطة، وعدادات الطلبات لفرض الحدود اليومية.",
            "نسجّل بيانات تشغيل كافية لتشغيل الخدمة ومعالجة الأعطال وتطبيق حد المجاني (5 طلبات يومياً) وحد Pro (20,000 طلب يومياً). لا نجمع أرقام هواتف ولا نوفر دخولاً عبر Google.",
          ],
        },
        {
          title: "محتوى الأخبار",
          paragraphs: [
            "العناوين والملخصات المفهرسة مأخوذة من مواد الناشرين المتاحة للعموم. تبقى ملكية المحتوى للناشر. نحتفظ بفهرس حتى تعيد الواجهة حقولاً منظمة بالعربية والإنجليزية.",
          ],
        },
        {
          title: "ملفات الارتباط والجلسات",
          paragraphs: [
            "جلسات اللوحة بعد تسجيل الدخول تستخدم ملفات ارتباط لإبقائك متصلاً. صفحات التسويق لا تتطلب ملف ارتباط للحساب. لغة الصفحات العامة معامل في الرابط (`lang=en`)، وليست ملفاً تتبعياً.",
          ],
        },
        {
          title: "ما لا نفعله",
          paragraphs: [
            "لا نبيع بيانات الحساب الشخصية. لا نستخدم بريد اللوحة في رسائل تسويقية إلا إذا راسلتنا وطلبت رداً.",
          ],
        },
        {
          title: "التواصل",
          paragraphs: [
            "أسئلة عن بيانات الحساب المخزّنة: hello@brieflynewsstream.com.",
          ],
        },
      ],
    },
    terms: {
      title: "الشروط",
      lede: "استخدام عادل لواجهة Briefly NewsStream ولوحة المطوّر والموجز العام.",
      updated: "آخر تحديث: 21 أغسطس 2026",
      sections: [
        {
          title: "الخدمة",
          paragraphs: [
            "توفر Briefly NewsStream أخبار أسواق منظمة (حقول عربية وإنجليزية، درجات أثر، فلاتر دولة وفئة) عبر واجهة JSON وموجز عام ولوحة مطوّر.",
          ],
        },
        {
          title: "الحسابات والمفاتيح",
          paragraphs: [
            "أنت مسؤول عن مفاتيح API في حسابك. لا تضع المفاتيح السرية في شيفرة عميل عامة. إذا تسرب مفتاح، ألغه من اللوحة وأنشئ مفتاحاً جديداً.",
          ],
        },
        {
          title: "الخطط والحدود",
          paragraphs: [
            "المجاني يشمل 5 طلبات API يومياً ومفتاحين. Pro مدرج بسعر 70 دولاراً شهرياً مع 20,000 طلب يومياً و10 مفاتيح. Enterprise تسعير مخصص. اطلب Pro من الفوترة. الدفع غير مفعّل في اللوحة بعد.",
          ],
        },
        {
          title: "محتوى المصادر",
          paragraphs: [
            "المقالات في الموجز تُجمع من ناشرين خارجيين. استخدم الواجهة لتشغيل منتجاتك، لا لإعادة نشر صفحات الناشر كاملة وكأنها محتواك. التزم بشروط موقع المصدر عند فتح الرابط الأصلي.",
          ],
        },
        {
          title: "التوفر",
          paragraphs: [
            "نشغّل مهام الجمع والنشر وفق جدول. لا ندّعي نسبة جاهزية رقمية. إذا انقطعت الخدمة، أعد المحاولة أو راسل hello@brieflynewsstream.com.",
          ],
        },
        {
          title: "التواصل",
          paragraphs: [
            "hello@brieflynewsstream.com",
          ],
        },
      ],
    },
  },
};

export function legalCopy(lang: MarketingLang, kind: "privacy" | "terms"): LegalPageCopy {
  return copy[lang][kind];
}
