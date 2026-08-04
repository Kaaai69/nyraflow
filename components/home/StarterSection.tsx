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
    <section id="starter" className="py-section-mobile md:py-section-desktop">
      <SectionContainer>
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {content.title}
          </h2>
          <p className="mt-3 text-title-compact">{content.price}</p>
        </header>
        <div className="starter-grid mt-12 grid gap-4 md:grid-cols-12 xl:gap-5">
          {content.items.map((item) => {
            const Icon = starterIcons[item.icon];

            return (
              <article key={item.id} className="commercial-card p-7 md:p-8">
                <Icon
                  aria-hidden
                  size={32}
                  weight="regular"
                  className="text-cyan"
                />
                <h3 className="mt-10 text-xl font-semibold leading-tight">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-text-secondary">
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
