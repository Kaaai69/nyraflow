import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function MetricsSection() {
  const items = homeContent.metrics.items;

  return (
    <section
      id="metrics"
      aria-label="Опыт и результаты"
      className="pb-section-mobile md:pb-section-desktop bg-transparent text-[#FFFFFF]"
    >
      <SectionContainer>
        {/* Large Visual Dark Container Block */}
        <div className="relative overflow-hidden rounded-[22px] border border-white/14 bg-[#151515]/75 backdrop-blur-md p-8 md:p-10 lg:p-12 text-white shadow-2xl">
          {/* Subtle Grid Overlay Background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 grid gap-10 md:grid-cols-3 md:gap-6 items-stretch">
            {/* Metric 1 - 2+ */}
            {items[0] && (
              <div className="flex flex-col justify-between border-b border-white/14 pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-6 min-w-0">
                <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white block truncate">
                  {items[0].value}
                </span>
                <div className="mt-6">
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    {items[0].title}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm leading-relaxed text-white/70">
                    {items[0].description}
                  </p>
                </div>
              </div>
            )}

            {/* Metric 2 - 20+ */}
            {items[1] && (
              <div className="flex flex-col justify-between border-b border-white/14 pb-8 md:border-b-0 md:border-r md:pb-0 md:px-6 min-w-0">
                <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white block truncate">
                  {items[1].value}
                </span>
                <div className="mt-6">
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    {items[1].title}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm leading-relaxed text-white/70">
                    {items[1].description}
                  </p>
                </div>
              </div>
            )}

            {/* Metric 3 - 100% */}
            {items[2] && (
              <div className="flex flex-col justify-between md:pl-6 min-w-0">
                <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white block truncate">
                  {items[2].value}
                </span>
                <div className="mt-6">
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    {items[2].title}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm leading-relaxed text-white/70">
                    {items[2].description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
