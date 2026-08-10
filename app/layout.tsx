import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PRODUCT_CONFIG } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCT_CONFIG.siteUrl),
  title: "16型恋爱人格测试",
  description: "免费完成8道恋爱场景题，看看你最接近16种恋爱人格中的哪一种。",
  openGraph: {
    title: "16型恋爱人格测试",
    description: "免费开始，8道题找到你的初步恋爱人格；完整20题可重新校准正式人格。",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og-cover.jpg", width: 1200, height: 630, alt: "16型恋爱人格测试" }],
  },
  twitter: { card: "summary_large_image", title: "16型恋爱人格测试", description: "免费8道题，找到你的初步恋爱人格。", images: ["/og-cover.jpg"] },
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
