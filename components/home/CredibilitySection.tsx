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
        <div className="grid gap-8 md:grid-cols-3 md:gap-10 border-t border-white/18 pt-10">
          {homeContent.credibility.items.map((item, index) => (
            <article
              key={item.id}
              className="flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold tracking-widest text-white/50 uppercase">
                  0{index + 1}
                </span>
                <h2 className="mt-4 text-2xl font-bold leading-snug tracking-tight text-white md:text-3xl">
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
