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
    <section id="services" className="py-section-mobile md:py-section-desktop bg-[#F5F5F2] text-[#101114]">
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} lightTheme />

        <div className="mt-14 divide-y divide-[#101114]/16 border-t border-b border-[#101114]/16 md:mt-20">
          {content.items.map((item, index) => (
            <article
              key={item.id}
              className="py-10 lg:grid lg:grid-cols-12 lg:gap-8"
            >
              <div className="lg:col-span-3">
                <span className="text-xs font-bold tracking-widest text-[#101114]/50 uppercase">
                  0{index + 1}
                </span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#101114] md:text-3xl">
                  {item.title}
                </h3>
              </div>
              <div className="mt-8 grid gap-8 md:grid-cols-3 lg:col-span-9 lg:mt-0">
                {(Object.keys(serviceLabels) as Array<keyof typeof serviceLabels>).map(
                  (key) => (
                    <div
                      key={key}
                      className={
                        key === "businessOutcome"
                          ? "rounded-xl border border-[#101114]/16 bg-white p-6 shadow-sm"
                          : "p-2"
                      }
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-[#101114]">
                        {serviceLabels[key]}
                      </p>
                      <p className="mt-3 text-base leading-relaxed text-[#101114]/75">
                        {item[key]}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <a
            href="#contact"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#101114] px-8 font-semibold text-[#FFFFFF] hover:bg-[#000000] hover:scale-105 active:scale-95 transition-all"
          >
            {content.cta}
          </a>
        </div>
      </SectionContainer>
    </section>
  );
}
