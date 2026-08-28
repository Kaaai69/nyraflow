"use client";

import { useState } from "react";
import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";

import { CoverflowCarousel } from "@/components/ui/coverflow-carousel";
import { homeContent, type WorkMedia } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";

export default function WorkSection() {
  const content = homeContent.work;
  const projects: readonly WorkMedia[] = content.media;

  const [selected, setSelected] = useState(0);
  const active = projects[selected];

  const open = (index: number) => {
    const project = projects[index];
    if (project) window.open(project.href, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="work"
      className="py-section-mobile md:py-section-desktop bg-transparent text-white"
    >
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />
      </SectionContainer>

      {/* Карусель живёт вне контейнера: карточки уходят за края экрана,
          и обрезать их шириной колонки — потерять весь эффект глубины. */}
      <div className="mt-10 md:mt-14">
        <CoverflowCarousel
          slides={projects.map((project) => ({
            src: project.src,
            alt: project.alt,
            title: project.title,
            subtitle: project.caption,
          }))}
          cardWidth="clamp(280px, 54vw, 660px)"
          cardAspect={1.6}
          rotate={38}
          depth={0.52}
          perspective={2.6}
          fade={0.13}
          gap={0.06}
          showNavigation
          showPagination
          label="Концепты лендингов"
          onSelectedChange={setSelected}
          onActivate={open}
          cardClassName="rounded-2xl border border-white/12 bg-white/5 shadow-card-strong"
        />
      </div>

      <SectionContainer>
        <div
          key={active?.id}
          className="mt-10 flex animate-cf-fade-in flex-col items-center text-center md:mt-12"
        >
          <span className="font-mono text-xs font-bold tracking-widest text-white/45">
            {String(selected + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </span>

          <h3 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {active?.title}
          </h3>
          <p className="mt-2 text-base text-white/60">{active?.caption}</p>

          <a
            href={active?.href}
            target="_blank"
            rel="noreferrer noopener"
            className="group/btn mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 font-semibold text-[#101114] shadow-md transition-all hover:scale-105 hover:bg-white/90 active:scale-95"
          >
            <span>{active?.cta}</span>
            <ArrowUpRightIcon
              size={18}
              weight="bold"
              className="transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
            />
          </a>

          <p className="mt-6 text-[13px] text-white/35">
            Перетащите карусель, кликните по соседней карточке или листайте стрелками ← →
          </p>
        </div>
      </SectionContainer>
    </section>
  );
}
