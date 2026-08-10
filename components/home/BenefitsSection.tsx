import {
  ChartBarIcon,
  FileTextIcon,
  GraduationCapIcon,
  InfinityIcon,
} from "@phosphor-icons/react/ssr";

import { homeContent, type BenefitIconName } from "../../content/home";
import { SectionContainer } from "./Layout";

const benefitIcons = {
  marketing: ChartBarIcon,
  legal: FileTextIcon,
  result: InfinityIcon,
  growth: GraduationCapIcon,
} satisfies Record<BenefitIconName, typeof ChartBarIcon>;

export default function BenefitsSection() {
  const content = homeContent.benefits;

  return (
    <section id="benefits" data-theme="light" className="py-section-mobile md:py-section-desktop bg-transparent text-[#101114]">
      <SectionContainer>
        <header className="border-b border-[#101114]/12 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#101114]/50">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#101114] sm:text-4xl md:text-5xl">
            {content.title}
          </h2>
        </header>

        {/* 2x2 Grid with 1 Inverted Dark Card (#101114) */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
          {content.items.map((item, index) => {
            const Icon = benefitIcons[item.icon];
            const isInverted = index === 2; // Card 3 is inverted dark

            return (
              <article
                key={item.id}
                className={`flex flex-col justify-between rounded-[16px] p-8 shadow-sm transition-all duration-300 backdrop-blur-md hover:-translate-y-1 ${
                  isInverted
                    ? "bg-[#101114]/90 text-white border border-[#101114]"
                    : "bg-[#FFFFFF]/80 text-[#101114] border border-[#101114]/14 hover:border-[#101114]/30 hover:bg-[#FFFFFF]/95"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon
                    aria-hidden
                    size={32}
                    weight="regular"
                    className={`shrink-0 ${isInverted ? "text-white" : "text-[#101114]"}`}
                  />
                  <span className={`text-xs font-bold tracking-widest uppercase ${
                    isInverted ? "text-white/50" : "text-[#101114]/40"
                  }`}>
                    0{index + 1}
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className={`text-xl font-bold leading-tight ${
                    isInverted ? "text-white" : "text-[#101114]"
                  }`}>
                    {item.title}
                  </h3>
                  <p className={`mt-3 text-base leading-relaxed ${
                    isInverted ? "text-white/75" : "text-[#101114]/75"
                  }`}>
                    {item.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
