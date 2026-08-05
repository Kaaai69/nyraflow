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
    <section id="benefits" className="py-section-mobile md:py-section-desktop bg-[#0B0C0E]">
      <SectionContainer>
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#38BDF8]">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 text-title-compact text-balance text-[#F1F5F9]">
            {content.title}
          </h2>
        </header>

        <div className="mt-12 grid gap-4 md:grid-cols-2 md:gap-5 xl:mt-16">
          {content.items.map((item) => {
            const Icon = benefitIcons[item.icon];

            return (
              <article
                key={item.id}
                className="rounded-card border border-white/10 bg-[#16181D]/60 p-7 backdrop-blur-md shadow-card transition-all duration-300 hover:border-white/20 hover:bg-[#16181D]/80 md:p-8"
              >
                <div className="flex items-start gap-4">
                  <Icon
                    aria-hidden
                    size={28}
                    weight="regular"
                    className="mt-0.5 shrink-0 text-[#38BDF8]"
                  />
                  <div>
                    <h3 className="text-xl font-semibold leading-tight text-[#F1F5F9]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-[#94A3B8]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
