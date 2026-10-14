import Image from "next/image";

import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionHeading, MotionGrid, MotionCard } from "../ScrollRevealSection";

export default function TeamSection() {
  const content = homeContent.team;

  return (
    <section id="team" className="py-section-mobile md:py-section-desktop bg-transparent text-white">
      <SectionContainer className="grid gap-12 lg:grid-cols-12 lg:gap-10 xl:gap-14 items-center">
        {/* Left Column: Headline with Controlled Typography & Balanced Wrapping */}
        <header className="min-w-0 lg:col-span-5 lg:pr-2 xl:pr-6">
          <MotionHeading>
            <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white/50">
              Команда
            </span>
            <h2 className="text-display mt-4 max-w-lg font-bold text-white">
              {content.title}
            </h2>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-white/70 max-w-md">
              {content.description}
            </p>
          </MotionHeading>
        </header>

        {/* Right Column: ARCHETYPE E Image-Led Portraits (Minimal Caption Slab) */}
        <MotionGrid className="grid min-w-0 gap-5 sm:gap-6 sm:grid-cols-2 lg:col-span-7 items-stretch">
          {content.items.map((member) => (
            <MotionCard key={member.id} radius="12px">
              <article className="min-w-0 group overflow-hidden transition-all duration-300 flex flex-col justify-between h-full">
                {/* Image Dominates Directly with Emergence Gradient */}
                <div className="aspect-[4/5] overflow-hidden relative rounded-xl border border-white/14 bg-[#0E0F12]">
                  <Image
                    {...member.photo}
                    sizes="(max-width: 639px) 100vw, (max-width: 1024px) 50vw, 300px"
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
                </div>
              </article>
            </MotionCard>
          ))}
        </MotionGrid>
      </SectionContainer>
    </section>
  );
}
