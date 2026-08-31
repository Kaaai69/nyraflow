"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { homeContent, type ProblemItem } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionHeading } from "../ScrollRevealSection";
import WordIlluminate from "../WordIlluminate";
import StackingCards, {
  StackingCardItem,
} from "@/components/ui/stacking-cards";

/**
 * «Проблема» — колода карточек, которая собирается при прокрутке: каждая
 * карточка прилипает к верху экрана и слегка ужимается, пока следующая
 * наезжает сверху. Так ни один пункт нельзя пролистать мимо.
 *
 * Секция намеренно НЕ обёрнута в ScrollRevealSection: тот вешает transform на
 * родителя, а трансформированный предок ломает position: sticky.
 */
export default function ProblemSection() {
  const { items, conclusion } = homeContent.problem;
  const prefersReducedMotion = useReducedMotion();

  // Ветку выбираем только после монтирования: useReducedMotion на сервере
  // всегда null, и если разойтись с ним сразу, React падает на гидрации.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  return (
    <section
      id="problem"
      className="py-section-mobile md:py-section-desktop bg-transparent text-white"
    >
      <SectionContainer>
        <header className="border-b border-white/14 pb-12 md:pb-16">
          <MotionHeading>
            <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white/50">
              ПРОБЛЕМА
            </span>
          </MotionHeading>
          {/* Ключевая строка секции: подсвечивается по словам при прокрутке. */}
          <WordIlluminate
            as="h2"
            text="Почему сайт не превращает трафик в заявки?"
            className="text-display mt-4 max-w-4xl font-bold text-white"
          />
        </header>
      </SectionContainer>

      {reduced ? (
        // Без анимации: те же карточки обычным списком, без залипания и масштаба.
        <div className="mt-12 flex flex-col gap-6 md:mt-16">
          {items.map((item, index) => (
            <SectionContainer key={item.id}>
              <div className="h-[545px] sm:h-[554px] lg:h-[560px]">
                <ProblemCard item={item} index={index} />
              </div>
            </SectionContainer>
          ))}
        </div>
      ) : (
        <StackingCards
          totalCards={items.length}
          scaleMultiplier={0.04}
          className="mt-12 md:mt-16"
        >
          {items.map((item, index) => (
            <StackingCardItem
              key={item.id}
              index={index}
              className="h-[620px] sm:h-[660px] lg:h-[700px]"
            >
              <SectionContainer className="h-[88%] sm:h-[84%] lg:h-[80%]">
                <ProblemCard item={item} index={index} />
              </SectionContainer>
            </StackingCardItem>
          ))}
        </StackingCards>
      )}

      <SectionContainer>
        <p className="mt-16 max-w-[65ch] border-t border-white/14 pt-10 text-lg leading-relaxed text-white/70 md:mt-24 md:text-xl">
          {conclusion}
        </p>
      </SectionContainer>
    </section>
  );
}

type ProblemCardProps = Readonly<{
  item: ProblemItem;
  index: number;
}>;

function ProblemCard({ item, index }: ProblemCardProps) {
  return (
    <article className="flex h-full flex-col gap-5 overflow-hidden rounded-[28px] border border-white/[0.07] bg-[linear-gradient(180deg,#0E0F12_0%,#0A0B0D_45%,#070709_100%)] p-6 shadow-[0_30px_90px_-24px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.045)] sm:p-8 lg:flex-row lg:items-center lg:gap-12 lg:p-12">
      <div className="flex flex-col lg:w-[46%] lg:shrink-0">
        <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white/35">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-display-sm mt-4 text-balance font-bold text-white">
          {item.title}
        </h3>
        <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-white/65 md:text-lg">
          {item.description}
        </p>
      </div>

      {/* Кадр по размеру самой иллюстрации: object-contain плюс max-* не режет
          её по краям и не оставляет полей чужого цвета вокруг. */}
      <div className="flex min-h-0 flex-1 items-center justify-center lg:h-full">
        <Image
          src={item.image.src}
          alt={item.image.alt}
          width={item.image.width}
          height={item.image.height}
          sizes="(min-width: 1024px) 45vw, 90vw"
          className="h-auto max-h-full w-auto max-w-full rounded-2xl object-contain ring-1 ring-white/10"
        />
      </div>
    </article>
  );
}
