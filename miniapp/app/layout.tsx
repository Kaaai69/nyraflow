import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";

import "@fontsource-variable/onest";

import "./globals.css";

export const metadata: Metadata = {
  title: "nyraflow desk",
  description: "Смета, бриф и статус проекта — внутри Telegram.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <head>
        {/* Обязателен для Mini App и должен грузиться до гидрации:
            через него приходят initData, тема и управление интерфейсом. */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
