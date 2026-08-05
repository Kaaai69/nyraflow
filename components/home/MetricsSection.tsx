import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function MetricsSection() {
  return (
    <section
      id="metrics"
      aria-label="Опыт и результаты"
      className="pb-section-mobile md:pb-section-desktop bg-[#F5F5F2] text-[#101114]"
    >
      <SectionContainer>
        <div className="border-t border-b border-[#101114]/16 py-12">
          <div className="grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-[#101114]/16">
            {homeContent.metrics.items.map((item) => {
              return (
                <article
                  key={item.id}
                  className="flex flex-col justify-between md:px-8 first:pl-0 last:pr-0"
                >
                  <div>
                    <p className="text-5xl font-bold tracking-tight text-[#101114] md:text-6xl lg:text-7xl">
                      {item.value}
                    </p>
                    <h2 className="mt-4 text-xl font-bold leading-tight text-[#101114]">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-base leading-relaxed text-[#101114]/75">
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
