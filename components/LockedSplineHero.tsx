"use client";

import { useRef, type ComponentProps } from "react";
import Spline from "@splinetool/react-spline";
import {
  getCurrentSplineTarget,
  resolveSplineTarget,
  scrollToSection,
} from "@/lib/spline-navigation";

type SplineOnLoad = NonNullable<ComponentProps<typeof Spline>["onLoad"]>;
type SplineApplication = Parameters<SplineOnLoad>[0];

export default function LockedSplineHero() {
  const appRef = useRef<SplineApplication | null>(null);

  const handleLoad: SplineOnLoad = (application) => {
    appRef.current = application;
  };

  const handlePointerUp = () => {
    const target = getCurrentSplineTarget(appRef.current);
    const id = target ? resolveSplineTarget(target) : null;

    if (id) scrollToSection(id);
  };

  return (
    <Spline
      scene="https://prod.spline.design/xOl5brZcGdsZ7KV4/scene.splinecode"
      onLoad={handleLoad}
      onPointerUp={handlePointerUp}
    />
  );
}
