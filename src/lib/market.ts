import { Category, Region } from "@prisma/client";

export const CATEGORY_META = [
  { code: "gold", value: Category.GOLD, label: "Gold & precious metals", labelAr: "الذهب والمعادن الثمينة" },
  { code: "finance", value: Category.FINANCE, label: "Financial markets", labelAr: "الأسواق المالية" },
  { code: "economics", value: Category.ECONOMICS, label: "Economics & central banks", labelAr: "الاقتصاد والبنوك المركزية" },
  { code: "oil", value: Category.OIL, label: "Oil & energy", labelAr: "النفط والطاقة" },
  { code: "me_economy", value: Category.ME_ECONOMY, label: "Middle East economy", labelAr: "اقتصاد الشرق الأوسط" },
  { code: "commodities", value: Category.COMMODITIES, label: "Commodities", labelAr: "السلع" },
  { code: "markets", value: Category.MARKETS, label: "Other market-moving news", labelAr: "أخبار السوق المؤثرة" },
] as const;

export const REGION_META = [
  { code: "middle_east", value: Region.MIDDLE_EAST, label: "Middle East", labelAr: "الشرق الأوسط" },
  { code: "america", value: Region.AMERICA, label: "America", labelAr: "الأمريكتان" },
  { code: "global", value: Region.GLOBAL, label: "Global", labelAr: "عالمي" },
] as const;

export const categoryFromCode = (code: string) =>
  CATEGORY_META.find((item) => item.code === code.toLowerCase())?.value;

export const categoryToCode = (value: Category) =>
  CATEGORY_META.find((item) => item.value === value)?.code ?? "markets";

export const regionFromCode = (code: string) =>
  REGION_META.find((item) => item.code === code.toLowerCase())?.value;

export const regionToCode = (value: Region) =>
  REGION_META.find((item) => item.value === value)?.code ?? "global";

export function kuwaitDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Kuwait",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
