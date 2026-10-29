import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

const siteUrl = "https://www.asyncdevph.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ASYNC Development — Account Generator & FiveM Tools",
  description:
    "High-performance FiveM asset recovery, and instant account generator portal — Trusted by thousands.",
  applicationName: "ASYNC Development",
  authors: [{ name: "ASYNC Development" }],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "ASYNC Development — Account Generator & FiveM Tools",
    description:
      "High-performance FiveM asset recovery, and instant account generator portal — Trusted by thousands.",
    siteName: "ASYNC Development",
    images: [
      {
        url: "/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "ASYNC Development",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ASYNC Development — Account Generator & FiveM Tools",
    description:
      "High-performance FiveM asset recovery, and instant account generator portal — Trusted by thousands.",
    images: ["/og-banner.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  other: {
    "theme-color": "#7c3aed",
  },
};

import DevToolsProtection from "@/components/DevToolsProtection";
import SessionInactivityTracker from "@/components/SessionInactivityTracker";
import VisitorTracker from "@/components/VisitorTracker";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const host = (headersList.get("x-forwarded-host") || headersList.get("host") || "").toLowerCase();
  const subdomain = host.startsWith("gen.") ? "gen" : host.startsWith("admin.") ? "admin" : host.startsWith("reseller.") ? "reseller" : "main";

  return (
    <html
      lang="en"
      data-subdomain={subdomain}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#7c3aed" />
        <meta property="og:site_name" content="ASYNC Development" />
      </head>
      <body className="min-h-full flex flex-col" data-subdomain={subdomain}>
        <DevToolsProtection />
        <SessionInactivityTracker />
        <VisitorTracker />
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
