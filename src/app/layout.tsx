import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Toaster } from "@/components/Toaster";
import {
  SITE_NAME,
  SEO_DESCRIPTION_AR,
  SEO_KEYWORDS_AR,
  OG_SHARE_TAGLINE_AR,
  PRODUCT_LINE_AR,
  ogImages,
  ogShareAbsoluteUrl,
  geoMetaTags,
} from "@/lib/seo";
import { publicSiteUrl } from "@/lib/site-url";
import "./globals.css";
import "./console-gate.css";
import "./brand-loader.css";

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
  preload: true,
});

const siteUrl = publicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} | ${PRODUCT_LINE_AR}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SEO_DESCRIPTION_AR,
  applicationName: SITE_NAME,
  keywords: [...SEO_KEYWORDS_AR],
  authors: [{ name: SITE_NAME, url: siteUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Technology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
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
    locale: "ar_SA",
    alternateLocale: ["en_US", "ar_SA", "ar_AE", "ar_EG"],
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${PRODUCT_LINE_AR}`,
    description: OG_SHARE_TAGLINE_AR,
    images: ogImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${PRODUCT_LINE_AR}`,
    description: OG_SHARE_TAGLINE_AR,
    images: [ogShareAbsoluteUrl()],
  },
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon-48x48.png",
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: "90qpdjOnSY4h4VFDK775mlmTycXHPMnM2AO0JVV40K4",
  },
  other: geoMetaTags(),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1422",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${plexArabic.variable} h-full antialiased`}
    >
      <body className="min-h-[100dvh] flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
