import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AppShell } from '@/components/shell/AppShell'
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
  title: "LSUPERAGENT V11 Public Beta",
  description: "AI ช่วยคิด ทำไว งานสำเร็จ ทุกไอเดีย...เป็นผลงาน",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
        <SpeedInsights />
      </body>
    </html>
  );
}
