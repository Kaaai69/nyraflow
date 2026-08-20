import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@fontsource-variable/onest";

import "./globals.css";

const siteDescription =
  "Сайты, веб-сервисы и AI-автоматизация, которые превращают трафик в заявки, а сложные процессы — в понятную систему.";

export const metadata: Metadata = {
  metadataBase: new URL("https://nyraflow.ru"),
  title: "nyraflow — Digital-продукты для бизнеса",
  description: siteDescription,
  applicationName: "nyraflow",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "nyraflow",
    title: "nyraflow — digital-продукты для бизнеса",
    description: siteDescription,
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "nyraflow — digital-продукты для бизнеса",
    description: siteDescription,
  },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-[#000000] text-white antialiased selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
