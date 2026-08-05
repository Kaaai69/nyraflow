import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function ProcessSection() {
  const content = homeContent.process;

  return (
    <section id="process" className="py-section-mobile md:py-section-desktop xl:py-section-wide bg-[#0B0C0E]">
      <SectionContainer>
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#38BDF8]">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 text-title-compact text-balance text-[#F1F5F9]">
            {content.title}
          </h2>
        </header>

        <ol className="process-steps mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:mt-20 xl:grid-cols-5">
          {content.items.map((item, index) => (
            <li key={item.id} className="process-step">
              <span className="process-step-number border border-white/20 bg-[#16181D] text-[#F1F5F9]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 text-xl font-bold leading-tight tracking-[-0.01em] text-[#F1F5F9]">
                {item.title}
              </h3>
              <p className="mt-4 text-[0.9375rem] leading-[1.65] text-[#94A3B8]">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </SectionContainer>
    </section>
  );
}
