"use client";

import { useEffect, useState } from "react";
import { BrandLoaderScreen } from "@/components/media/BrandLoader";

export default function MarketingLoading() {
  const [label, setLabel] = useState("جارٍ التحميل");

  useEffect(() => {
    const lang = document.querySelector(".mkt")?.getAttribute("lang");
    setLabel(lang === "en" ? "Loading" : "جارٍ التحميل");
  }, []);

  return <BrandLoaderScreen label={label} tone="paper" />;
}
