import {
  BrowserIcon,
  PulseIcon,
  RobotIcon,
  TextAlignLeftIcon,
} from "@phosphor-icons/react/ssr";

import { homeContent, type StarterIconName } from "../../content/home";
import { SectionContainer } from "./Layout";

const starterIcons = {
  structure: BrowserIcon,
  copy: TextAlignLeftIcon,
  analytics: PulseIcon,
  automation: RobotIcon,
} satisfies Record<StarterIconName, typeof BrowserIcon>;

export default function StarterSection() {
  const content = homeContent.starter;

  return (
    <section id="starter" className="py-section-mobile md:py-section-desktop bg-[#F5F5F2] text-[#101114]">
      <SectionContainer>
        <header className="border-t border-[#101114]/16 pt-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#101114]">
            {content.title}
          </h2>
          <p className="mt-3 text-title-compact text-[#101114] font-bold">{content.price}</p>
        </header>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          {content.items.map((item) => {
            const Icon = starterIcons[item.icon];

            return (
              <article
                key={item.id}
                className="rounded-card border border-[#101114]/16 bg-white p-7 shadow-sm transition-all duration-300 hover:border-[#101114]/30 md:p-8"
              >
                <Icon
                  aria-hidden
                  size={32}
                  weight="regular"
                  className="text-[#101114]"
                />
                <h3 className="mt-8 text-xl font-bold leading-tight text-[#101114]">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[#101114]/75">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
