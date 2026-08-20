import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionGrid, MotionCard } from "../ScrollRevealSection";

export default function MetricsSection() {
  const items = homeContent.metrics.items;

  return (
    <section
      id="metrics"
      aria-label="Опыт и результаты"
      className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]"
    >
      <SectionContainer>
        {/* Open Editorial Typography Floating in Space (No Truncation / No Ellipsis) */}
        <MotionGrid className="grid gap-12 md:grid-cols-3 md:gap-8 items-stretch border-y border-white/14 py-12 md:py-16" staggerDelay={0.12}>
          {/* Metric 1 - 2+ */}
          {items[0] && (
            <MotionCard tilt={false}>
              <div className="flex h-full flex-col justify-between border-b border-white/14 pb-10 md:border-b-0 md:border-r md:pb-0 md:pr-6 lg:pr-10 min-w-0">
                <span className="text-6xl sm:text-7xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight text-white block whitespace-nowrap">
                  {items[0].value}
                </span>
                <div className="mt-8">
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {items[0].title}
                  </h3>
                  <p className="mt-3 text-sm md:text-base leading-relaxed text-white/70">
                    {items[0].description}
                  </p>
                </div>
              </div>
            </MotionCard>
          )}

          {/* Metric 2 - 20+ */}
          {items[1] && (
            <MotionCard tilt={false}>
              <div className="flex h-full flex-col justify-between border-b border-white/14 pb-10 md:border-b-0 md:border-r md:pb-0 md:px-6 lg:px-10 min-w-0">
                <span className="text-6xl sm:text-7xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight text-white block whitespace-nowrap">
                  {items[1].value}
                </span>
                <div className="mt-8">
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {items[1].title}
                  </h3>
                  <p className="mt-3 text-sm md:text-base leading-relaxed text-white/70">
                    {items[1].description}
                  </p>
                </div>
              </div>
            </MotionCard>
          )}

          {/* Metric 3 - 100% (Guaranteed No Ellipsis / Full Visibility) */}
          {items[2] && (
            <MotionCard tilt={false}>
              <div className="flex h-full flex-col justify-between md:pl-6 lg:pl-10 min-w-0">
                <span className="text-6xl sm:text-7xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight text-white block whitespace-nowrap">
                  {items[2].value}
                </span>
                <div className="mt-8">
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {items[2].title}
                  </h3>
                  <p className="mt-3 text-sm md:text-base leading-relaxed text-white/70">
                    {items[2].description}
                  </p>
                </div>
              </div>
            </MotionCard>
          )}
        </MotionGrid>
      </SectionContainer>
    </section>
  );
}
