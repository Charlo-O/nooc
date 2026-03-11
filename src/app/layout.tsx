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
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background flex`}>
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
