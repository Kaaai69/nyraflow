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
        <div className="grid gap-8 border-t border-[#101114]/16 pt-10 md:grid-cols-3 md:gap-10">
          {homeContent.metrics.items.map((item) => {
            return (
              <article key={item.id} className="flex flex-col justify-between">
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
      </SectionContainer>
    </section>
  );
}
