import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "ASYNC DEVELOPMENT - FiveM Asset Recovery & Web Panel",
  description: "High-performance asset recovery, FiveM Lua decryption, and 3D vertex reconstruction portal.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

import DevToolsProtection from "@/components/DevToolsProtection";
import SessionInactivityTracker from "@/components/SessionInactivityTracker";
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
      <body className="min-h-full flex flex-col" data-subdomain={subdomain}>
        <DevToolsProtection />
        <SessionInactivityTracker />
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
