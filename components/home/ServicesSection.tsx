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
    <section id="services" className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]">
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />

        {/* ARCHETYPE C: Stacked Product Slabs */}
        <div className="mt-14 space-y-10 md:mt-16">
          {content.items.map((item, index) => {
            const watermark = watermarks[index] ?? "FLOW";
            const isAiInverted = watermark === "AI";
            const isSystemDark = watermark === "SYSTEM";

            return (
              <MotionSlab key={item.id} delay={index * 0.1}>
                <article
                  className={`relative overflow-hidden rounded-[22px] p-8 md:p-12 transition-all duration-500 shadow-2xl ${
                    isAiInverted
                      ? "bg-[#F0EFEA] text-[#101114] border border-[#101114]/20"
                      : isSystemDark
                      ? "bg-[#0E0F12]/90 text-white border border-white/14 backdrop-blur-md"
                      : "bg-transparent text-white border border-white/14 backdrop-blur-sm"
                  }`}
                >
                  {/* Watermark Text Background */}
                  <span
                    aria-hidden="true"
                    className={`absolute -right-4 -bottom-6 text-8xl md:text-9xl font-black tracking-widest pointer-events-none select-none ${
                      isAiInverted ? "text-black/5" : "text-white/5"
                    }`}
                  >
                    {watermark}
                  </span>

                  <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
                    {/* Left Column: Number & Service Title */}
                    <div
                      className={`lg:col-span-4 border-b pb-6 lg:border-b-0 lg:pb-0 lg:border-r lg:pr-8 ${
                        isAiInverted ? "border-[#101114]/15" : "border-white/16"
                      }`}
                    >
                      <span
                        className={`text-xs font-mono font-bold tracking-widest uppercase ${
                          isAiInverted ? "text-[#101114]/60" : "text-white/50"
                        }`}
                      >
                        0{index + 1}
                      </span>
                      <h3
                        className={`mt-3 text-3xl font-bold tracking-tight md:text-4xl ${
                          isAiInverted ? "text-[#101114]" : "text-white"
                        }`}
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
                            className={`rounded-xl p-5 ${
                              key === "businessOutcome"
                                ? isAiInverted
                                  ? "bg-[#101114]/10 border border-[#101114]/15"
                                  : "bg-white/10 border border-white/15"
                                : ""
                            }`}
                          >
                            <p
                              className={`text-xs font-bold uppercase tracking-wider ${
                                isAiInverted ? "text-[#101114]/60" : "opacity-60"
                              }`}
                            >
                              {serviceLabels[key]}
                            </p>
                            <p
                              className={`mt-3 text-base leading-relaxed font-medium ${
                                isAiInverted ? "text-[#101114]/90" : "opacity-90"
                              }`}
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
            className="inline-flex h-14 items-center justify-center rounded-full bg-white px-9 text-base font-semibold text-[#101114] hover:bg-[#F0EFEA] hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            {content.cta}
          </a>
        </div>
      </SectionContainer>
    </section>
  );
}
