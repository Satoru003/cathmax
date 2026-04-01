import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "catholicmaxxxing",
  description: "Doomscroll your way to holiness. Catholic teachings in an infinite feed.",
  metadataBase: new URL("https://catholicmaxxxing.com"),
  openGraph: {
    title: "catholicmaxxxing",
    description: "Doomscroll your way to holiness. Catholic teachings in an infinite feed.",
    url: "https://catholicmaxxxing.com",
    siteName: "catholicmaxxxing",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "catholicmaxxxing",
    description: "Doomscroll your way to holiness. Catholic teachings in an infinite feed.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full bg-black text-[var(--foreground)]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
