import { Category, Region } from "@prisma/client";

export const CATEGORY_META = [
  { code: "gold", value: Category.GOLD, label: "Precious metals", labelAr: "المعادن الثمينة" },
  { code: "finance", value: Category.FINANCE, label: "Financial markets", labelAr: "الأسواق المالية" },
  { code: "economics", value: Category.ECONOMICS, label: "Economics & central banks", labelAr: "الاقتصاد والبنوك المركزية" },
  { code: "oil", value: Category.OIL, label: "Oil & gas", labelAr: "النفط والغاز" },
  { code: "me_economy", value: Category.ME_ECONOMY, label: "Middle East economy", labelAr: "اقتصاد الشرق الأوسط" },
  { code: "commodities", value: Category.COMMODITIES, label: "Commodities", labelAr: "السلع" },
  { code: "banking", value: Category.BANKING, label: "Banking", labelAr: "البنوك والمصارف" },
  { code: "real_estate", value: Category.REAL_ESTATE, label: "Real estate", labelAr: "العقارات" },
  { code: "tech", value: Category.TECH, label: "Technology", labelAr: "التكنولوجيا" },
  { code: "energy", value: Category.ENERGY, label: "Energy & utilities", labelAr: "الطاقة والمرافق" },
  { code: "trade", value: Category.TRADE, label: "Global trade", labelAr: "التجارة العالمية" },
  { code: "fx", value: Category.FX, label: "Currencies & FX", labelAr: "العملات والصرف" },
  { code: "crypto", value: Category.CRYPTO, label: "Crypto & digital assets", labelAr: "الأصول الرقمية والمشفرة" },
  { code: "shipping", value: Category.SHIPPING, label: "Shipping & logistics", labelAr: "الشحن والخدمات اللوجستية" },
  { code: "insurance", value: Category.INSURANCE, label: "Insurance", labelAr: "التأمين" },
  { code: "policy", value: Category.POLICY, label: "Policy & regulation", labelAr: "السياسات والتنظيم" },
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
