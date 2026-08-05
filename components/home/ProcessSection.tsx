import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function ProcessSection() {
  const content = homeContent.process;

  return (
    <section id="process" className="py-section-mobile md:py-section-desktop bg-[#F5F5F2] text-[#101114]">
      <SectionContainer>
        <header className="border-t border-[#101114]/16 pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#101114]">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 text-title-compact text-balance text-[#101114] font-bold">
            {content.title}
          </h2>
        </header>

        <ol className="mt-14 grid gap-8 sm:grid-cols-2 xl:mt-16 xl:grid-cols-5">
          {content.items.map((item, index) => (
            <li key={item.id} className="border-t border-[#101114]/16 pt-6">
              <span className="text-xl font-bold text-[#101114]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-xl font-bold leading-tight text-[#101114]">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-[#101114]/75">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </SectionContainer>
    </section>
  );
}
