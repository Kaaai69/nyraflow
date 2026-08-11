import Image from "next/image";

import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionHeading, MotionGrid, MotionCard } from "../ScrollRevealSection";

export default function TeamSection() {
  const content = homeContent.team;
  const originalItems = content.items;

  // Reorder so Федор (Founder) is in the center position (#2) and staggered higher
  const fedor = originalItems.find((m) => m.name === "Федор") ?? originalItems[0];
  const arseny = originalItems.find((m) => m.name === "Арсений") ?? originalItems[1];
  const artem = originalItems.find((m) => m.name === "Артём") ?? originalItems[2];

  const teamMembers = [arseny, fedor, artem];

  return (
    <section id="team" className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]">
      <SectionContainer className="grid gap-12 lg:grid-cols-12 lg:gap-10 xl:gap-14 items-center">
        {/* Left Column: Headline with Controlled Typography & Balanced Wrapping */}
        <header className="min-w-0 lg:col-span-5 lg:pr-2 xl:pr-6">
          <MotionHeading>
            <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white/50">
              Команда
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-[38px] xl:text-[44px] font-bold tracking-tight text-white leading-[1.18] max-w-lg">
              {content.title}
            </h2>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-white/70 max-w-md">
              {content.description}
            </p>
          </MotionHeading>
        </header>

        {/* Right Column: ARCHETYPE E Image-Led Portraits (Minimal Caption Slab) */}
        <MotionGrid className="grid min-w-0 gap-5 sm:gap-6 sm:grid-cols-3 lg:col-span-7 items-stretch">
          {teamMembers.map((member, index) => {
            const isCenter = index === 1;

            return (
              <MotionCard key={member.id}>
                <article
                  className={`min-w-0 group overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                    isCenter ? "sm:-translate-y-4 md:-translate-y-6" : ""
                  }`}
                >
                  {/* Image Dominates Directly with Emergence Gradient */}
                  <div className="aspect-[4/5] overflow-hidden relative rounded-xl border border-white/14 bg-[#0E0F12]">
                    <Image
                      {...member.photo}
                      sizes="(max-width: 767px) 100vw, (max-width: 1024px) 33vw, 300px"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {/* Soft Bottom Emergence Gradient */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0E0F12] via-[#0E0F12]/60 to-transparent pointer-events-none" />
                  </div>

                  {/* Attached Minimal Caption Slab */}
                  <div className="pt-4 px-1">
                    <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-white/90 transition-colors">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-xs md:text-sm text-white/60">
                      {member.role}
                    </p>
                  </div>
                </article>
              </MotionCard>
            );
          })}
        </MotionGrid>
      </SectionContainer>
    </section>
  );
}
