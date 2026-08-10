import { homeContent } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";

const serviceLabels = {
  whenNeeded: "Когда нужны",
  whatWeDo: "Что делаем",
  businessOutcome: "Что получает бизнес",
} as const;

const watermarks = ["WEB", "SYSTEM", "AI"] as const;

export default function ServicesSection() {
  const content = homeContent.services;

  return (
    <section id="services" data-theme="light" className="py-section-mobile md:py-section-desktop bg-transparent text-[#101114]">
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} lightTheme />

        <div className="mt-14 space-y-8 md:mt-16">
          {content.items.map((item, index) => {
            const watermark = watermarks[index] ?? "FLOW";

            return (
              <article
                key={item.id}
                className="relative overflow-hidden rounded-[20px] p-8 md:p-12 transition-all duration-300 shadow-sm backdrop-blur-md bg-[#FFFFFF]/80 text-[#101114] border border-[#101114]/14 hover:bg-[#FFFFFF]/95 hover:border-[#101114]/30"
              >
                {/* Watermark Text Background */}
                <span
                  aria-hidden="true"
                  className="absolute -right-4 -bottom-6 text-8xl md:text-9xl font-black tracking-widest pointer-events-none select-none text-[#101114]/4"
                >
                  {watermark}
                </span>

                <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
                  {/* Left Column: Number & Service Title */}
                  <div className="lg:col-span-4 border-b pb-6 lg:border-b-0 lg:pb-0 lg:border-r lg:pr-8 border-[#101114]/16">
                    <span className="text-xs font-bold tracking-widest uppercase text-[#101114]/40">
                      0{index + 1}
                    </span>
                    <h3 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-[#101114]">
                      {item.title}
                    </h3>
                  </div>

                  {/* Right 3 Sub-columns */}
                  <div className="grid gap-6 sm:grid-cols-3 lg:col-span-8">
                    {(Object.keys(serviceLabels) as Array<keyof typeof serviceLabels>).map(
                      (key) => (
                        <div
                          key={key}
                          className={`rounded-xl p-5 ${
                            key === "businessOutcome"
                              ? "bg-[#F3F2ED] border border-[#101114]/12"
                              : ""
                          }`}
                        >
                          <p className="text-xs font-bold uppercase tracking-wider opacity-60">
                            {serviceLabels[key]}
                          </p>
                          <p className="mt-3 text-base leading-relaxed opacity-90 font-medium">
                            {item[key]}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 text-center md:text-left">
          <a
            href="#contact"
            className="inline-flex h-14 items-center justify-center rounded-full bg-[#101114] px-9 text-base font-semibold text-[#FFFFFF] hover:bg-[#000000] hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            {content.cta}
          </a>
        </div>
      </SectionContainer>
    </section>
  );
}
