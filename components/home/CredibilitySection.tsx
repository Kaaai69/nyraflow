import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function CredibilitySection() {
  return (
    <section
      id="credibility"
      aria-label="Почему нам доверяют"
      className="py-section-mobile md:py-section-credibility bg-[#0B0C0E]"
    >
      <SectionContainer>
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {homeContent.credibility.items.map((item) => (
            <article
              key={item.id}
              className="rounded-card border border-white/10 bg-[#16181D]/60 p-7 backdrop-blur-md shadow-card transition-all duration-300 hover:border-white/20 hover:bg-[#16181D]/80 md:p-8"
            >
              <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-[#F1F5F9]">
                {item.title}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#94A3B8]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
