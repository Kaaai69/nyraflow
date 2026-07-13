"use client";

import { useRef } from "react";
import type { SplineEvent } from "@splinetool/react-spline";
import Spline from "@splinetool/react-spline/next";
import {
  nextSplineHoverTarget,
  resolveSplineTarget,
  scrollToSection,
} from "@/lib/spline-navigation";

export default function LockedSplineHero() {
  const activeTarget = useRef<string | null>(null);

  const handleSplineHover = (event: SplineEvent) => {
    activeTarget.current = nextSplineHoverTarget(
      activeTarget.current,
      event.target.name,
    );
  };

  const clearActiveTarget = () => {
    activeTarget.current = null;
  };

  const handlePointerUp = () => {
    const id = activeTarget.current
      ? resolveSplineTarget(activeTarget.current)
      : null;

    if (id) scrollToSection(id);
  };

  return (
    <Spline
      scene="https://prod.spline.design/xOl5brZcGdsZ7KV4/scene.splinecode"
      onSplineMouseHover={handleSplineHover}
      onPointerLeave={clearActiveTarget}
      onPointerUp={handlePointerUp}
    />
  );
}
