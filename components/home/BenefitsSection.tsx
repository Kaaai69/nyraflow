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
    <section id="benefits" className="py-section-mobile md:py-section-desktop bg-[#F5F5F2] text-[#101114]">
      <SectionContainer>
        <header className="border-t border-[#101114]/16 pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#101114]">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 text-title-compact text-balance text-[#101114] font-bold">
            {content.title}
          </h2>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-6 xl:mt-14">
          {content.items.map((item) => {
            const Icon = benefitIcons[item.icon];

            return (
              <article
                key={item.id}
                className="rounded-card border border-[#101114]/16 bg-white p-7 shadow-sm transition-all duration-300 hover:border-[#101114]/30 md:p-8"
              >
                <div className="flex items-start gap-4">
                  <Icon
                    aria-hidden
                    size={28}
                    weight="regular"
                    className="mt-0.5 shrink-0 text-[#101114]"
                  />
                  <div>
                    <h3 className="text-xl font-bold leading-tight text-[#101114]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-[#101114]/75">
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
