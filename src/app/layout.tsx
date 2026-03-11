import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nooc - 小说结构化分析",
  description: "上传长文本，自动生成结构化角色、关系、事件、时间线文件",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} flex h-dvh overflow-hidden bg-background font-sans antialiased`}>
        <Sidebar />
        <main className="soft-scrollbar flex min-h-0 min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
