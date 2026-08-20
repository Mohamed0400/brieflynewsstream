import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Toaster } from "@/components/Toaster";
import {
  SITE_NAME,
  SEO_DESCRIPTION_EN,
  SEO_KEYWORDS_EN,
  OG_SHARE_TAGLINE,
  ogImages,
  ogShareAbsoluteUrl,
  geoMetaTags,
} from "@/lib/seo";
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
    default: `${SITE_NAME} | Market news API for Kuwait & Middle East`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SEO_DESCRIPTION_EN,
  applicationName: SITE_NAME,
  keywords: [...SEO_KEYWORDS_EN],
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
    locale: "ar_KW",
    alternateLocale: ["en_US", "ar_SA", "ar_AE", "ar_EG"],
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Market news API for Kuwait & Middle East`,
    description: OG_SHARE_TAGLINE,
    images: ogImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Market news API for Kuwait & Middle East`,
    description: OG_SHARE_TAGLINE,
    images: [ogShareAbsoluteUrl()],
  },
  verification: {
    google: "90qpdjOnSY4h4VFDK775mlmTycXHPMnM2AO0JVV40K4",
  },
  other: geoMetaTags(),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
