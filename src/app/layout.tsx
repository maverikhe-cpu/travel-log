import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "漫行记 WanderLog - 漫行山水间，记录时光里",
  description: "漫行记 WanderLog - 团队旅行协同记录，漫行山水间，记录时光里",
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
