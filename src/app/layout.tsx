import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
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
  title: "MLBNSPH.com — PH Gaming Marketplace & Midman Coordination",
  description:
    "Philippine-focused marketplace connecting buyers, sellers, and verified midmen with structured transaction tracking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          <div className="mx-auto max-w-6xl px-4">
            MLBNSPH.com — Never share game passwords, OTPs, or recovery codes on
            this platform.
          </div>
        </footer>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
