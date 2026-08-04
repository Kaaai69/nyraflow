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
      className="pb-section-mobile md:pb-section-desktop"
    >
      <SectionContainer>
        <div className="metrics-grid grid gap-4 md:grid-cols-12 md:gap-5">
          {homeContent.metrics.items.map((item, index) => {
            const Icon = icons[index];

            return (
              <article key={item.id} className="metric-card commercial-card p-7 md:p-9">
                {Icon ? (
                  <Icon
                    aria-hidden
                    size={34}
                    weight="regular"
                    className="text-cyan"
                  />
                ) : null}
                <p className="mt-10 text-5xl font-semibold tracking-[-0.045em] md:text-6xl">
                  {item.value}
                </p>
                <h2 className="mt-6 text-xl font-semibold leading-tight">
                  {item.title}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-text-secondary">
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
