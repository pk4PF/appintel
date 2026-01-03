import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SavedAppsRefresher from "./components/SavedAppsRefresher";
import CookieConsent from "./components/CookieConsent";
import SegmentationTracker from "./components/SegmentationTracker";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://appintel.net'),
  title: {
    default: "App Intel | Find Your Next $10k/mo App Idea",
    template: "%s | App Intel"
  },
  description: "We analyze thousands of high-revenue iOS apps so you can find validated ideas that are already making money.",
  openGraph: {
    title: "App Intel | Find Your Next $10k/mo App Idea",
    description: "We analyze thousands of high-revenue iOS apps so you can find validated ideas that are already making money.",
    siteName: "App Intel",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "App Intel - Find winning iOS app niches",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "App Intel | Find Your Next $10k/mo App Idea",
    description: "We analyze thousands of high-revenue iOS apps so you can find validated ideas that are already making money.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {children}
        <SavedAppsRefresher />
        <CookieConsent />
        <SegmentationTracker />
        <Analytics />
      </body>
    </html>
  );
}
