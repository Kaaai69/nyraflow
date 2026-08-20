import {
  BrowserIcon,
  PulseIcon,
  RobotIcon,
  TextAlignLeftIcon,
} from "@phosphor-icons/react/ssr";

import { homeContent, type StarterIconName } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionGrid, MotionCard } from "../ScrollRevealSection";

const starterIcons = {
  structure: BrowserIcon,
  copy: TextAlignLeftIcon,
  analytics: PulseIcon,
  automation: RobotIcon,
} satisfies Record<StarterIconName, typeof BrowserIcon>;

export default function StarterSection() {
  const content = homeContent.starter;

  return (
    <section id="starter" className="py-section-mobile md:py-section-desktop bg-transparent text-white">
      <SectionContainer>
        {/* Large Architectural Composition Frame */}
        <div className="rounded-[22px] border border-white/14 border-t-white/30 bg-[#0E0F12]/90 backdrop-blur-md p-8 md:p-12 lg:p-14 shadow-2xl">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left 30%: Open Editorial Headline & Price */}
            <header className="lg:col-span-4 border-b border-white/16 pb-8 lg:border-b-0 lg:pb-0 lg:border-r lg:pr-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-white/50">
                  {content.title}
                </span>
                <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl leading-tight">
                  {content.price}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/12 hidden lg:block">
                <a
                  href="#contact"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[#101114] hover:bg-[#F0EFEA] hover:scale-105 transition-all shadow-md"
                >
                  Заказать быстрый старт
                </a>
              </div>
            </header>

            {/* Right 70%: Open Architectural Row Grid (Horizontal Dividers, No Boxes) */}
            <MotionGrid className="lg:col-span-8 grid gap-8 sm:grid-cols-2 divide-y sm:divide-y-0 divide-white/12">
              {content.items.map((item, index) => {
                const Icon = starterIcons[item.icon];

                return (
                  <MotionCard key={item.id} tilt={false}>
                    <article className="flex h-full flex-col justify-between pt-6 sm:pt-0 group/item">
                      <div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                          <Icon
                            aria-hidden
                            size={28}
                            weight="regular"
                            className="text-white group-hover/item:scale-110 transition-transform duration-300"
                          />
                          <span className="text-xs font-mono font-bold tracking-widest text-white/50 uppercase">
                            0{index + 1}
                          </span>
                        </div>
                        <h3 className="mt-6 text-lg font-bold leading-tight text-white group-hover/item:text-white transition-colors">
                          {item.title}
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-white/75 group-hover/item:text-white/90 transition-colors">
                          {item.description}
                        </p>
                      </div>
                    </article>
                  </MotionCard>
                );
              })}
            </MotionGrid>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
