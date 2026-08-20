import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Toaster } from "@/components/Toaster";
import { publicSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = publicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Briefly NewsStream",
    template: "%s · Briefly NewsStream",
  },
  description:
    "Arabic-first market news API: bilingual AR/EN coverage across ~70 countries, market-impact scoring, community briefings, and a developer console.",
  applicationName: "Briefly NewsStream",
  keywords: [
    "market news API",
    "Arabic news API",
    "bilingual news",
    "Briefly NewsStream",
    "impact scoring",
    "developer console",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: {
      ar: "/",
      en: "/?lang=en",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "ar",
    alternateLocale: ["en_US"],
    url: "/",
    siteName: "Briefly NewsStream",
    title: "Briefly NewsStream — Market news API, Arabic-first",
    description:
      "Bilingual AR+EN market news with impact scoring, community briefings, and a permanent archive.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Briefly NewsStream — Market news API, Arabic-first",
    description:
      "Bilingual AR+EN market news with impact scoring, community briefings, and a permanent archive.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      className={`${geistSans.variable} ${geistMono.variable} ${plexArabic.variable} h-full antialiased`}
    >
      <body className="min-h-[100dvh] flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
