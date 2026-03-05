import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "HCM Minister Portal",
  description: "Next.js BFF for the Minister Portal backend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <nav style={{ display: "flex", gap: 16, padding: 16, borderBottom: "1px solid #eee", fontFamily: "var(--font-geist-sans)" }}>
          <Link href="/">Home</Link>
          <Link href="/login">Login</Link>
          <Link href="/cases">Cases</Link>
          <Link href="/examples">Examples (Drizzle)</Link>
        </nav>
        <main style={{ padding: 16, fontFamily: "var(--font-geist-sans)" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
