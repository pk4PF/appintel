import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SavedAppsRefresher from "./components/SavedAppsRefresher";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "App Intel - Discover App Opportunities",
  description: "Find high-potential app ideas by analyzing iOS App Store trends, user reviews, and market gaps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-black`} suppressHydrationWarning>
        {children}
        <SavedAppsRefresher />
      </body>
    </html>
  );
}
