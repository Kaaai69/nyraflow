import {
  BriefcaseIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
} from "@phosphor-icons/react/ssr";

import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

const icons = [ChartLineUpIcon, BriefcaseIcon, ClipboardTextIcon] as const;

export default function MetricsSection() {
  return (
    <section
      id="metrics"
      aria-label="Опыт и результаты"
      className="pb-section-mobile md:pb-section-desktop bg-[#0B0C0E]"
    >
      <SectionContainer>
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {homeContent.metrics.items.map((item, index) => {
            const Icon = icons[index];

            return (
              <article
                key={item.id}
                className="rounded-card border border-white/10 bg-[#16181D]/60 p-7 backdrop-blur-md shadow-card transition-all duration-300 hover:border-white/20 hover:bg-[#16181D]/80 md:p-9"
              >
                {Icon ? (
                  <Icon
                    aria-hidden
                    size={34}
                    weight="regular"
                    className="text-[#38BDF8]"
                  />
                ) : null}
                <p className="mt-10 text-5xl font-semibold tracking-[-0.045em] text-[#F1F5F9] md:text-6xl">
                  {item.value}
                </p>
                <h2 className="mt-6 text-xl font-semibold leading-tight text-[#F1F5F9]">
                  {item.title}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-[#94A3B8]">
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
