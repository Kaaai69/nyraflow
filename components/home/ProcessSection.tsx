import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function ProcessSection() {
  const content = homeContent.process;

  const stepStyles = [
    { width: "w-full", bg: "bg-[#151515]/75 backdrop-blur-md text-white border-white/14" },
    { width: "w-full lg:w-[90%] lg:ml-auto", bg: "bg-[#1A1C20]/80 backdrop-blur-md text-white border-white/14" },
    { width: "w-full lg:w-[95%]", bg: "bg-[#151515]/75 backdrop-blur-md text-white border-white/14" },
    { width: "w-full lg:w-[85%] lg:ml-auto", bg: "bg-[#1A1C20]/80 backdrop-blur-md text-white border-white/14" },
    { width: "w-full", bg: "bg-[#202227]/90 backdrop-blur-md text-white border-white/20" },
  ];

  return (
    <section id="process" className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]">
      <SectionContainer>
        <header className="mb-12 border-b border-white/14 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {content.title}
          </h2>
        </header>

        {/* Stepped Block Layout */}
        <div className="space-y-4">
          {content.items.map((item, index) => {
            const style = stepStyles[index] ?? stepStyles[0];

            return (
              <div
                key={item.id}
                className={`rounded-[14px] border p-6 md:p-8 shadow-xl transition-all duration-300 hover:border-white/30 hover:-translate-y-0.5 ${style.width} ${style.bg}`}
              >
                <div className="grid gap-4 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-4 flex items-center gap-4">
                    <span className="text-2xl font-bold tracking-tight text-white/50">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                      {item.title}
                    </h3>
                  </div>

                  <div className="md:col-span-8">
                    <p className="text-base leading-relaxed text-white/75">
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
