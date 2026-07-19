"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";

import MobileHero from "./MobileHero";

const DesktopSplineHero = dynamic(() => import("./LockedSplineHero"), {
  ssr: false,
  loading: () => <div className="desktop-hero-reservation" aria-hidden />,
});

export default function ResponsiveHero() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop ? (
    <>
      <DesktopSplineHero />
      <div className="desktop-hero-logo" aria-hidden={false}>
        <div className="mx-auto w-full max-w-site px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop">
          <a
            href="#top"
            aria-label="nyraflow — на главную"
            className="inline-flex items-center"
          >
            <Image
              src="/images/brand/lockup-transparent.png"
              alt="nyraflow"
              width={1027}
              height={164}
              priority
              className="h-8 w-auto"
            />
          </a>
        </div>
      </div>
    </>
  ) : (
    <>
      <MobileHero />
      <div className="desktop-hero-reservation" aria-hidden />
    </>
  );
}
