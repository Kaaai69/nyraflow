import { homeContent } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";
import { MotionSlab } from "../ScrollRevealSection";

const serviceLabels = {
  whenNeeded: "Когда нужны",
  whatWeDo: "Что делаем",
  businessOutcome: "Что получает бизнес",
} as const;

const watermarks = ["WEB", "SYSTEM", "AI"] as const;

export default function ServicesSection() {
  const content = homeContent.services;

  return (
    <section id="services" className="py-section-mobile md:py-section-desktop bg-transparent text-white">
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />

        {/* ARCHETYPE C: Stacked Product Slabs */}
        <div className="mt-14 space-y-10 md:mt-16">
          {content.items.map((item, index) => {
            const watermark = watermarks[index] ?? "FLOW";
            const isAiInverted = watermark === "AI";

            return (
              <MotionSlab
                key={item.id}
                delay={index * 0.1}
              >
                <article
                  className={`card-glass relative overflow-hidden p-8 text-white md:p-12 ${
                    isAiInverted ? "card-glass-featured" : ""
                  }`}
                >
                  {/* Watermark Text Background */}
                  <span
                    aria-hidden="true"
                    className="text-outline pointer-events-none absolute -right-4 -bottom-6 select-none text-8xl font-black tracking-widest opacity-30 md:text-9xl"
                  >
                    {watermark}
                  </span>

                  <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
                    {/* Left Column: Number & Service Title */}
                    <div
                      className="border-b border-white/16 pb-6 lg:col-span-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8"
                    >
                      <span
                        className="font-mono text-xs font-bold uppercase tracking-widest text-white/50"
                      >
                        0{index + 1}
                      </span>
                      <h3
                        className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl"
                      >
                        {item.title}
                      </h3>
                    </div>

                    {/* Right 3 Sub-columns */}
                    <div className="grid gap-6 sm:grid-cols-3 lg:col-span-8">
                      {(Object.keys(serviceLabels) as Array<keyof typeof serviceLabels>).map(
                        (key) => (
                          <div
                            key={key}
                            className={`p-5 ${
                              key === "businessOutcome" ? "card-inset" : ""
                            }`}
                          >
                            <p
                              className="text-xs font-bold uppercase tracking-wider opacity-60"
                            >
                              {serviceLabels[key]}
                            </p>
                            <p
                              className="mt-3 text-base font-medium leading-relaxed opacity-90"
                            >
                              {item[key]}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </article>
              </MotionSlab>
            );
          })}
        </div>

        <div className="mt-12 text-center md:text-left">
          <a
            href="#contact"
            className="inline-flex h-14 items-center justify-center rounded-full bg-white px-9 text-base font-semibold text-[#101114] hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            {content.cta}
          </a>
        </div>
      </SectionContainer>
    </section>
  );
}
