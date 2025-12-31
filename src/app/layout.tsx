import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SavedAppsRefresher from "./components/SavedAppsRefresher";
import CookieConsent from "./components/CookieConsent";
import SegmentationTracker from "./components/SegmentationTracker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "App Intel | Finding iOS Market Gaps",
    template: "%s | App Intel"
  },
  description: "Find high-potential opportunities in the iOS App Store. Track emerging trends and user pain points to build your next successful indie app.",
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
      </body>
    </html>
  );
}
