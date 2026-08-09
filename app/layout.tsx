import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PRODUCT_CONFIG } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCT_CONFIG.siteUrl),
  title: "16型恋爱人格测试",
  description: "20道恋爱场景题，看看你在喜欢一个人之后会变成哪一种恋爱人格。",
  openGraph: {
    title: "16型恋爱人格测试",
    description: "有些人越喜欢越主动，有些人越喜欢反而越安静。",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og-cover.jpg", width: 1200, height: 630, alt: "16型恋爱人格测试" }],
  },
  twitter: { card: "summary_large_image", title: "16型恋爱人格测试", description: "20道题，找到你的恋爱人格。", images: ["/og-cover.jpg"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f0e9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
