"use client";

import { useState } from "react";
import Image from "next/image";
import { PlusIcon, MinusIcon, ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { motion, AnimatePresence } from "framer-motion";

import { homeContent, type WorkMedia } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";

export default function WorkSection() {
  const content = homeContent.work;
  const projects: readonly WorkMedia[] = content.media;
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  const toggleProject = (id: string) => {
    setOpenProjectId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="work"
      className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]"
    >
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />

        <div className="mt-12 md:mt-16 border-t border-white/18 divide-y divide-white/18">
          {projects.map((project, index) => {
            const isOpen = openProjectId === project.id;
            const projectNumber = String(index + 1).padStart(2, "0");

            return (
              <div key={project.id} className="py-2 transition-colors">
                {/* ACCORDION HEADER BUTTON */}
                <button
                  type="button"
                  onClick={() => toggleProject(project.id)}
                  aria-expanded={isOpen}
                  aria-controls={`project-panel-${project.id}`}
                  className="w-full py-6 flex items-center justify-between gap-4 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg"
                >
                  <div className="flex items-center gap-6 md:gap-10 min-w-0">
                    <span className="text-sm font-bold tracking-widest text-white/50 shrink-0">
                      {projectNumber}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-white/80 transition-colors truncate">
                      {project.title}
                    </h3>
                    <span className="hidden md:inline-block text-sm text-white/50 truncate">
                      {project.caption}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium text-white/70 hidden sm:inline-block">
                      {isOpen ? "Свернуть" : "Открыть"}
                    </span>
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white group-hover:border-white transition-colors">
                      {isOpen ? (
                        <MinusIcon size={16} weight="bold" />
                      ) : (
                        <PlusIcon size={16} weight="bold" />
                      )}
                    </div>
                  </div>
                </button>

                {/* EXPANDABLE PANEL */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`project-panel-${project.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="py-6 grid gap-8 lg:grid-cols-12 lg:items-center">
                        {/* Project Image Preview */}
                        <div className="lg:col-span-7 aspect-[16/10] overflow-hidden rounded-xl border border-white/18 bg-[#101114]">
                          <Image
                            src={project.src}
                            alt={project.alt}
                            width={project.width}
                            height={project.height}
                            sizes="(max-width: 1024px) 100vw, 700px"
                            className="h-full w-full object-cover filter grayscale contrast-[1.04] transition-all duration-500 hover:grayscale-0"
                          />
                        </div>

                        {/* Project Details */}
                        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:pl-6">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                              {project.caption}
                            </span>
                            <h4 className="mt-2 text-3xl font-bold tracking-tight text-white">
                              {project.title}
                            </h4>
                            <p className="mt-4 text-base leading-relaxed text-white/75">
                              {project.alt} — разработка визуальной концепции, интерфейсов и цифровой экосистемы.
                            </p>
                          </div>

                          <div>
                            <a
                              href={project.href}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 font-semibold text-[#101114] hover:bg-[#F5F5F2] hover:scale-105 active:scale-95 transition-all"
                            >
                              <span>Открыть проект</span>
                              <ArrowUpRightIcon size={18} weight="bold" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
