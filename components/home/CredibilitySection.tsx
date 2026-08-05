import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function CredibilitySection() {
  return (
    <section
      id="credibility"
      aria-label="Принципы работы"
      className="py-section-mobile md:py-section-desktop bg-[#000000] text-[#FFFFFF]"
    >
      <SectionContainer>
        <div className="grid gap-6 md:grid-cols-3 md:gap-8 items-start">
          {homeContent.credibility.items.map((item, index) => {
            // Controlled stagger offset on desktop
            const staggerClass = index === 1 ? "md:mt-8" : "md:mt-0";

            return (
              <article
                key={item.id}
                className={`flex flex-col justify-between rounded-[16px] border border-white/13 bg-[#151515] p-8 md:p-10 shadow-lg transition-all duration-300 hover:border-white/30 hover:bg-[#1B1B1B] hover:-translate-y-1 ${staggerClass}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-widest text-white/50 uppercase">
                      0{index + 1}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-white/40" />
                  </div>
                  <h2 className="mt-8 text-2xl font-bold leading-snug tracking-tight text-white md:text-3xl">
                    {item.title}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-white/70">
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
