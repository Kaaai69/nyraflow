import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@fontsource-variable/onest";

import "./globals.css";

import CustomCursor from "@/components/CustomCursor";
import SmoothScroll from "@/components/SmoothScroll";
import { googleSiteVerification, siteUrl, yandexMetrikaId } from "@/lib/site";

const siteDescription =
  "Сайты, веб-сервисы и AI-автоматизация, которые превращают трафик в заявки, а сложные процессы — в понятную систему.";

// Инлайн, первым узлом <body>: счётчик должен успеть отправить просмотр даже
// если посетитель закроет вкладку сразу после открытия.
const metrikaSnippet = `
(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${yandexMetrikaId}', 'ym');

ym(${yandexMetrikaId}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
  verification: {
    google: googleSiteVerification,
  },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-[#000000] text-white antialiased selection:bg-white/20 selection:text-white">
        {/* Yandex.Metrika counter */}
        <script
          id="yandex-metrika"
          dangerouslySetInnerHTML={{ __html: metrikaSnippet }}
        />
        <noscript>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://mc.yandex.ru/watch/${yandexMetrikaId}`}
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
        {/* /Yandex.Metrika counter */}
        {children}
        <SmoothScroll />
        <CustomCursor />
      </body>
    </html>
  );
}
