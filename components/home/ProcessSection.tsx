import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionHeading, MotionGrid, MotionCard } from "../ScrollRevealSection";

export default function ProcessSection() {
  const content = homeContent.process;

  return (
    <section id="process" className="py-section-mobile md:py-section-desktop bg-transparent text-white">
      <SectionContainer>
        <header className="mb-12 border-b border-white/14 pb-8">
          <MotionHeading>
            <p className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-white/50">
              {content.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              {content.title}
            </h2>
          </MotionHeading>
        </header>

        {/* Editorial Stepped Rows Layout (No Card Enclosures) */}
        <MotionGrid className="border-t border-white/14 divide-y divide-white/14" staggerDelay={0.1}>
          {content.items.map((item, index) => {
            const stepNumber = String(index + 1).padStart(2, "0");

            return (
              <MotionCard key={item.id} tilt={false} radius="12px">
                <div className="py-8 md:py-10 grid gap-6 md:grid-cols-12 md:items-center group/step hover:bg-white/[0.015] px-2 md:px-4 rounded-xl transition-colors">
                  {/* Number & Step Title */}
                  <div className="md:col-span-5 flex items-center gap-6">
                    <span className="text-2xl font-mono font-bold text-white/40 group-hover/step:text-white/70 transition-colors">
                      {stepNumber}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover/step:text-white transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  {/* Step Description */}
                  <div className="md:col-span-7">
                    <p className="text-base leading-relaxed text-white/75 group-hover/step:text-white/90 transition-colors">
                      {item.description}
                    </p>
                  </div>
                </div>
              </MotionCard>
            );
          })}
        </MotionGrid>
      </SectionContainer>
    </section>
  );
}
