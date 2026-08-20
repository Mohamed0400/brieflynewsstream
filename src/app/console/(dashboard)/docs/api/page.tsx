import type { Metadata } from "next";
import { ApiDocs } from "@/components/console/ApiDocs";
import { getConsoleLang } from "@/lib/console-lang";
import { consoleDashboardCopy } from "@/lib/console-translation";

export async function generateMetadata(): Promise<Metadata> {
  const copy = consoleDashboardCopy(await getConsoleLang());
  return { title: copy.apiDocs.title };
}

export default function ConsoleApiDocsPage() {
  return <ApiDocs />;
}
