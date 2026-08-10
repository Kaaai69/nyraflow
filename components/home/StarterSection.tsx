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
    <section id="starter" className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]">
      <SectionContainer>
        {/* Large Elevated Container Panel */}
        <div className="rounded-[20px] border border-white/14 bg-[#151515]/75 backdrop-blur-md p-8 md:p-12 lg:p-14 shadow-2xl">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left 30%: Headline & Price */}
            <header className="lg:col-span-4 border-b border-white/16 pb-8 lg:border-b-0 lg:pb-0 lg:border-r lg:pr-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                  {content.title}
                </span>
                <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl leading-tight">
                  {content.price}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/12 hidden lg:block">
                <a
                  href="#contact"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[#101114] hover:bg-[#F3F3EF] hover:scale-105 transition-all shadow-md"
                >
                  Заказать быстрый старт
                </a>
              </div>
            </header>

            {/* Right 70%: 2x2 Grid of 4 Dark Cards */}
            <div className="lg:col-span-8 grid gap-6 sm:grid-cols-2">
              {content.items.map((item, index) => {
                const Icon = starterIcons[item.icon];

                return (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between rounded-[14px] border border-white/14 bg-[#202227]/80 backdrop-blur-md p-6 shadow-xl transition-all duration-300 hover:border-white/30 hover:bg-[#202227]/95 hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <Icon
                          aria-hidden
                          size={28}
                          weight="regular"
                          className="text-white"
                        />
                        <span className="text-xs font-bold tracking-widest text-white/50 uppercase">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-6 text-lg font-bold leading-tight text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/75">
                        {item.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
