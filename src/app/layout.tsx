import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "川渝行迹 - 团队旅行协同记录",
  description: "为川渝地区团体旅行提供简单、直观的行程规划与记录工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
