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
    <section id="benefits" className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]">
      <SectionContainer>
        <header className="border-b border-white/14 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {content.title}
          </h2>
        </header>

        {/* 2x2 Grid with 1 Inverted Dark Card */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
          {content.items.map((item, index) => {
            const Icon = benefitIcons[item.icon];
            const isHighlight = index === 2;

            return (
              <article
                key={item.id}
                className={`flex flex-col justify-between rounded-[16px] p-8 shadow-2xl transition-all duration-300 backdrop-blur-md hover:-translate-y-1 ${
                  isHighlight
                    ? "bg-[#202227]/90 text-white border border-white/20"
                    : "bg-[#151515]/75 text-white border border-white/14 hover:border-white/30 hover:bg-[#151515]/90"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon
                    aria-hidden
                    size={32}
                    weight="regular"
                    className="shrink-0 text-white"
                  />
                  <span className="text-xs font-bold tracking-widest uppercase text-white/50">
                    0{index + 1}
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-xl font-bold leading-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-white/75">
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
