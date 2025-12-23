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
  title: "AppGap",
  description: "Find high-potential app gaps in the App Store and get a full blueprint to build your next profitable spinoff.",
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
