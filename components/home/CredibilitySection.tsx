import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionGrid, MotionCard, MotionDivider } from "../ScrollRevealSection";

export default function CredibilitySection() {
  const items = homeContent.credibility.items;

  return (
    <section
      id="credibility"
      aria-label="Принципы работы"
      className="py-section-mobile md:py-section-desktop bg-transparent text-white"
    >
      <SectionContainer>
        {/* Open Editorial / Architectural Layout (No Outer Card / No Dark Box Background) */}
        <div className="border-y border-white/14 py-10 md:py-14">
          <MotionGrid className="grid gap-8 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/14 items-stretch" staggerDelay={0.1}>
            {items.map((item, index) => (
              <MotionCard key={item.id} tilt={false}>
                <article className="flex h-full flex-col justify-between pt-6 md:pt-0 md:px-6 lg:px-8 first:md:pl-0 last:md:pr-0 group/benefit">
                  <div>
                    {/* Mono Label & Horizontal Rule: 01 ───── */}
                    <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-widest text-white/50 uppercase group-hover/benefit:text-white/80 transition-colors">
                      <span>0{index + 1}</span>
                      <MotionDivider className="h-px bg-white/25 flex-1 max-w-[48px]" />
                    </div>

                    {/* Title */}
                    <h3 className="mt-6 text-2xl sm:text-3xl font-bold leading-snug tracking-tight text-white group-hover/benefit:text-white transition-colors">
                      {item.title}
                    </h3>

                    {/* Body */}
                    <p className="mt-4 text-base leading-relaxed text-white/75 group-hover/benefit:text-white/90 transition-colors">
                      {item.description}
                    </p>
                  </div>
                </article>
              </MotionCard>
            ))}
          </MotionGrid>
        </div>
      </SectionContainer>
    </section>
  );
}
