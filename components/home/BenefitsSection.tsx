import {
  ChartBarIcon,
  FileTextIcon,
  GraduationCapIcon,
  InfinityIcon,
} from "@phosphor-icons/react/ssr";

import { homeContent, type BenefitIconName } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionHeading, MotionGrid, MotionCard } from "../ScrollRevealSection";

const benefitIcons = {
  marketing: ChartBarIcon,
  legal: FileTextIcon,
  result: InfinityIcon,
  growth: GraduationCapIcon,
} satisfies Record<BenefitIconName, typeof ChartBarIcon>;

export default function BenefitsSection() {
  const content = homeContent.benefits;

  return (
    <section id="benefits" className="py-section-mobile md:py-section-desktop bg-transparent text-white">
      <SectionContainer>
        <header className="border-b border-white/14 pb-8">
          <MotionHeading>
            <p className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-white/50">
              {content.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              {content.title}
            </h2>
          </MotionHeading>
        </header>

        {/* 2x2 Open Editorial Grid Frame with Cross Dividers (No Floating Boxes) */}
        <div className="card-glass mt-12 p-6 sm:p-10">
          <MotionGrid className="grid gap-0 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/14 items-stretch">
            {content.items.map((item, index) => {
              const Icon = benefitIcons[item.icon];
              const isTop = index < 2;

              return (
                <MotionCard
                  key={item.id}
                  tilt={false}
                  radius="12px"
                  className={!isTop ? "md:border-t md:border-white/14" : ""}
                >
                  <article className="flex h-full flex-col justify-between p-6 lg:p-8 group/benefit transition-colors hover:bg-white/[0.02] rounded-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <Icon
                        aria-hidden
                        size={32}
                        weight="regular"
                        className="shrink-0 text-white group-hover/benefit:scale-110 transition-transform duration-300"
                      />
                      <span className="text-xs font-mono font-bold tracking-widest uppercase text-white/50">
                        0{index + 1}
                      </span>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-xl font-bold leading-tight text-white group-hover/benefit:text-white transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-white/75 group-hover/benefit:text-white/90 transition-colors">
                        {item.description}
                      </p>
                    </div>
                  </article>
                </MotionCard>
              );
            })}
          </MotionGrid>
        </div>
      </SectionContainer>
    </section>
  );
}
