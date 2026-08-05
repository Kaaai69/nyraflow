import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function ProcessSection() {
  const content = homeContent.process;

  const stepStyles = [
    { width: "w-full", bg: "bg-[#FFFFFF] text-[#101114] border-[#101114]/14" },
    { width: "w-full lg:w-[90%] lg:ml-auto", bg: "bg-[#E7E7E1] text-[#101114] border-[#101114]/14" },
    { width: "w-full lg:w-[95%]", bg: "bg-[#FFFFFF] text-[#101114] border-[#101114]/14" },
    { width: "w-full lg:w-[85%] lg:ml-auto", bg: "bg-[#E7E7E1] text-[#101114] border-[#101114]/14" },
    { width: "w-full", bg: "bg-[#101114] text-white border-[#101114]" },
  ];

  return (
    <section id="process" className="py-section-mobile md:py-section-desktop bg-[#F3F3EF] text-[#101114]">
      <SectionContainer>
        <header className="mb-12 border-b border-[#101114]/12 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#101114]/50">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#101114] sm:text-4xl md:text-5xl">
            {content.title}
          </h2>
        </header>

        {/* Stepped Block Layout */}
        <div className="space-y-4">
          {content.items.map((item, index) => {
            const style = stepStyles[index] ?? stepStyles[0];
            const isDark = index === 4;

            return (
              <div
                key={item.id}
                className={`rounded-[14px] border p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-0.5 ${style.width} ${style.bg}`}
              >
                <div className="grid gap-4 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-4 flex items-center gap-4">
                    <span
                      className={`text-2xl font-bold tracking-tight ${
                        isDark ? "text-white/50" : "text-[#101114]/40"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                      {item.title}
                    </h3>
                  </div>

                  <div className="md:col-span-8">
                    <p className={`text-base leading-relaxed ${
                      isDark ? "text-white/75" : "text-[#101114]/75"
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
