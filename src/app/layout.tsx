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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased text-ink-800 bg-background selection:bg-primary-100 selection:text-primary-900" style={{ fontFamily: "'Noto Sans SC', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
