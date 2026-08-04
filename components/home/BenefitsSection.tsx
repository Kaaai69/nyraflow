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
    <section id="benefits" className="py-section-mobile md:py-section-desktop">
      <SectionContainer>
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 text-title-compact text-balance">
            {content.title}
          </h2>
        </header>

        <div className="benefits-grid mt-12 grid gap-4 md:grid-cols-12 md:gap-5 xl:mt-16">
          {content.items.map((item) => {
            const Icon = benefitIcons[item.icon];

            return (
              <article
                key={item.id}
                className="rounded-card border border-line bg-surface p-7 shadow-card md:p-8"
              >
                <div className="flex items-start gap-4">
                  <Icon
                    aria-hidden
                    size={28}
                    weight="regular"
                    className="mt-0.5 shrink-0 text-cyan"
                  />
                  <div>
                    <h3 className="text-xl font-semibold leading-tight">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-text-secondary">
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
