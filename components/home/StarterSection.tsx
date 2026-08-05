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
    <section id="starter" className="py-section-mobile md:py-section-desktop bg-[#0B0C0E]">
      <SectionContainer>
        <header>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#38BDF8]">
            {content.title}
          </h2>
          <p className="mt-3 text-title-compact text-[#F1F5F9]">{content.price}</p>
        </header>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {content.items.map((item) => {
            const Icon = starterIcons[item.icon];

            return (
              <article
                key={item.id}
                className="rounded-card border border-white/10 bg-[#16181D]/60 p-7 backdrop-blur-md shadow-card transition-all duration-300 hover:border-white/20 hover:bg-[#16181D]/80 md:p-8"
              >
                <Icon
                  aria-hidden
                  size={32}
                  weight="regular"
                  className="text-[#38BDF8]"
                />
                <h3 className="mt-10 text-xl font-semibold leading-tight text-[#F1F5F9]">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
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
