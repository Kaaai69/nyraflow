"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import MobileHero from "./MobileHero";

const DesktopSplineHero = dynamic(() => import("./LockedSplineHero"), {
  ssr: false,
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

  return isDesktop ? <DesktopSplineHero /> : <MobileHero />;
}
