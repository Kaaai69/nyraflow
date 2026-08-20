import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionHeading, MotionGrid, MotionCard } from "../ScrollRevealSection";

export default function ProblemSection() {
  const items = homeContent.problem.items;

  return (
    <section id="problem" className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]">
      <SectionContainer>
        {/* Editorial Problem Header */}
        <header className="pb-12 md:pb-16 border-b border-white/14">
          <MotionHeading>
            <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white/50">
              ПРОБЛЕМА
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl leading-tight max-w-4xl">
              Почему сайт не превращает трафик в заявки?
            </h2>
          </MotionHeading>
        </header>

        {/* Open Editorial Rows (3 Problem Points) */}
        <div>
          <MotionGrid className="divide-y divide-white/14" staggerDelay={0.12}>
            {items.map((item, index) => {
              const rowNumber = String(index + 1).padStart(2, "0");

              return (
                <MotionCard key={item.id} tilt={false} radius="12px">
                  <div className="py-10 md:py-14 grid gap-6 lg:grid-cols-12 items-start group/row transition-colors hover:bg-white/[0.015] px-2 md:px-4 rounded-xl">
                    {/* Oversized Low-Contrast Mono Index Number */}
                    <div className="lg:col-span-2">
                      <span className="text-4xl md:text-5xl font-mono font-bold text-white/30 group-hover/row:text-white/60 transition-colors">
                        {rowNumber}
                      </span>
                    </div>

                    {/* Title Column */}
                    <div className="lg:col-span-4 lg:pr-6">
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white group-hover/row:text-white transition-colors">
                        {item.title}
                      </h3>
                    </div>

                    {/* Description Column */}
                    <div className="lg:col-span-6">
                      <p className="text-base md:text-lg leading-relaxed text-white/70 group-hover/row:text-white/90 transition-colors">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </MotionCard>
              );
            })}
          </MotionGrid>
        </div>
      </SectionContainer>
    </section>
  );
}
