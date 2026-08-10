import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function CredibilitySection() {
  return (
    <section
      id="credibility"
      aria-label="Принципы работы"
      className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]"
    >
      <SectionContainer>
        <div className="grid gap-6 md:grid-cols-3 md:gap-8 items-stretch">
          {homeContent.credibility.items.map((item, index) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-[16px] border border-white/14 bg-[#151515]/75 backdrop-blur-md p-8 md:p-10 shadow-2xl transition-all duration-300 hover:border-white/30 hover:bg-[#151515]/90 hover:-translate-y-1"
            >
              <div>
                <span className="text-sm font-bold tracking-widest text-white/50 uppercase">
                  0{index + 1}
                </span>
                <h2 className="mt-6 text-2xl font-bold leading-snug tracking-tight text-white md:text-3xl">
                  {item.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/70">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
