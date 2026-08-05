import { homeContent } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";

const serviceLabels = {
  whenNeeded: "Когда нужны",
  whatWeDo: "Что делаем",
  businessOutcome: "Что получает бизнес",
} as const;

export default function ServicesSection() {
  const content = homeContent.services;

  return (
    <section id="services" className="py-section-mobile md:py-section-desktop xl:py-section-wide bg-[#0B0C0E]">
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />

        <div className="mt-14 grid gap-5 md:mt-20">
          {content.items.map((item) => (
            <article
              key={item.id}
              className="service-panel grid gap-8 rounded-media border border-white/10 bg-[#16181D]/60 p-7 shadow-card backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-[#16181D]/90 md:p-9 lg:grid-cols-12 lg:gap-6"
            >
              <h3 className="service-title text-2xl font-semibold tracking-[-0.02em] text-[#F1F5F9] transition-transform duration-slow ease-premium md:text-subtitle lg:col-span-3 lg:pr-5">
                {item.title}
              </h3>
              <div className="grid gap-7 md:grid-cols-3 lg:col-span-9">
                {(Object.keys(serviceLabels) as Array<keyof typeof serviceLabels>).map(
                  (key) => (
                    <div
                      key={key}
                      className={
                        key === "businessOutcome"
                          ? "service-outcome rounded-card border border-white/15 bg-gradient-to-b from-[#1C2029]/80 to-[#16181D]/80 p-5 backdrop-blur-md"
                          : "p-5"
                      }
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
                        {serviceLabels[key]}
                      </p>
                      <p className="mt-3 text-base leading-relaxed text-[#94A3B8]">
                        {item[key]}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </article>
          ))}
        </div>

        <a
          href="#contact"
          className="mt-10 inline-flex min-h-[3rem] items-center justify-center rounded-full bg-white px-7 font-semibold text-[#0B0C0E] shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:bg-[#E2E8F0] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] active:scale-95"
        >
          {content.cta}
        </a>
      </SectionContainer>
    </section>
  );
}
