"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { homeContent } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";
import { MotionGrid, MotionCard } from "../ScrollRevealSection";

type ServiceItem = (typeof homeContent.services.items)[number];

// Timing lifted from the squishy-pricing reference: a long, overshooting
// ease is what makes the card read as rubber rather than as a hover state.
const SQUISH = { duration: 1, ease: "backInOut" } as const;
const SQUISH_DELAYED = { ...SQUISH, delay: 0.2 } as const;

/*
  The reference gets its impact from three saturated hues. This site has no
  colour at all, so the three tiers are separated on the only axis we do have:
  how much light the surface carries. Near-black, graphite, then the paper
  inversion. Same ladder the cards elsewhere on the site already use.
*/
type Skin = Readonly<{
  tag: string;
  surface: string;
  border: string;
  glowTone: "light" | "dark";
  title: string;
  body: string;
  label: string;
  chip: string;
  rule: string;
  button: string;
  shape: string;
}>;

const SKINS: readonly Skin[] = [
  {
    tag: "WEB",
    surface: "bg-[rgba(236,238,242,0.05)]",
    border: "border-white/12",
    glowTone: "light",
    title: "text-white",
    body: "text-white/75",
    label: "text-white/50",
    chip: "border-white/20 bg-white/10 text-white",
    rule: "border-white/14",
    button: "bg-white text-[#101114] hover:bg-white/90",
    shape: "rgba(236, 238, 242, 0.07)",
  },
  {
    tag: "SYSTEM",
    surface: "bg-[rgba(236,238,242,0.12)]",
    border: "border-white/22",
    glowTone: "light",
    title: "text-white",
    body: "text-white/80",
    label: "text-white/55",
    chip: "border-white/25 bg-white/15 text-white",
    rule: "border-white/18",
    button: "bg-white text-[#101114] hover:bg-white/90",
    shape: "rgba(236, 238, 242, 0.09)",
  },
  {
    tag: "AI",
    surface: "bg-[#F3F3EF]",
    border: "border-[#101114]/10",
    glowTone: "dark",
    title: "text-[#101114]",
    body: "text-[#101114]/75",
    label: "text-[#101114]/50",
    chip: "border-[#101114]/15 bg-[#101114]/8 text-[#101114]",
    rule: "border-[#101114]/12",
    button: "bg-[#101114] text-[#F3F3EF] hover:bg-[#101114]/90",
    shape: "rgba(16, 17, 20, 0.07)",
  },
];

/*
  The three background figures from the reference, recoloured. They are the
  part that actually squishes: the card scales a little, the shapes inside it
  scale a lot and change proportion, so the surface reads as deformable.
  `slice` rather than the default `meet` because these cards are wider than
  the 320x384 the paths were drawn against, and they grow when expanded.
*/
type ShapeProps = Readonly<{ fill: string }>;

function ShapeOrbs({ fill }: ShapeProps) {
  return (
    <motion.svg
      viewBox="0 0 320 384"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      variants={{ hover: { scale: 1.5 } }}
      transition={SQUISH}
      className="absolute inset-0 z-0 h-full w-full"
    >
      <motion.circle
        variants={{ hover: { scaleY: 0.5, y: -25 } }}
        transition={SQUISH_DELAYED}
        cx="160.5"
        cy="114.5"
        r="101.5"
        fill={fill}
      />
      <motion.ellipse
        variants={{ hover: { scaleY: 2.25, y: -25 } }}
        transition={SQUISH_DELAYED}
        cx="160.5"
        cy="265.5"
        rx="101.5"
        ry="43.5"
        fill={fill}
      />
    </motion.svg>
  );
}

function ShapeSlabs({ fill }: ShapeProps) {
  return (
    <motion.svg
      viewBox="0 0 320 384"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      variants={{ hover: { scale: 1.05 } }}
      transition={SQUISH}
      className="absolute inset-0 z-0 h-full w-full"
    >
      <motion.rect
        x="14"
        width="153"
        height="153"
        rx="15"
        fill={fill}
        style={{ y: 12 }}
        variants={{ hover: { y: 219, rotate: "90deg", scaleX: 2 } }}
        transition={SQUISH_DELAYED}
      />
      <motion.rect
        x="155"
        width="153"
        height="153"
        rx="15"
        fill={fill}
        style={{ y: 219 }}
        variants={{ hover: { y: 12, rotate: "90deg", scaleX: 2 } }}
        transition={SQUISH_DELAYED}
      />
    </motion.svg>
  );
}

const DIAMOND_PATHS = [
  "M148.893 157.531C154.751 151.673 164.249 151.673 170.107 157.531L267.393 254.818C273.251 260.676 273.251 270.173 267.393 276.031L218.75 324.674C186.027 357.397 132.973 357.397 100.25 324.674L51.6068 276.031C45.7489 270.173 45.7489 260.676 51.6068 254.818L148.893 157.531Z",
  "M148.893 99.069C154.751 93.2111 164.249 93.2111 170.107 99.069L267.393 196.356C273.251 202.213 273.251 211.711 267.393 217.569L218.75 266.212C186.027 298.935 132.973 298.935 100.25 266.212L51.6068 217.569C45.7489 211.711 45.7489 202.213 51.6068 196.356L148.893 99.069Z",
  "M148.893 40.6066C154.751 34.7487 164.249 34.7487 170.107 40.6066L267.393 137.893C273.251 143.751 273.251 153.249 267.393 159.106L218.75 207.75C186.027 240.473 132.973 240.473 100.25 207.75L51.6068 159.106C45.7489 153.249 45.7489 143.751 51.6068 137.893L148.893 40.6066Z",
] as const;

function ShapeStack({ fill }: ShapeProps) {
  return (
    <motion.svg
      viewBox="0 0 320 384"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      variants={{ hover: { scale: 1.25 } }}
      transition={SQUISH}
      className="absolute inset-0 z-0 h-full w-full"
    >
      {DIAMOND_PATHS.map((d, index) => (
        <motion.path
          key={d}
          d={d}
          fill={fill}
          variants={{ hover: { y: -50 } }}
          transition={{ ...SQUISH, delay: 0.3 - index * 0.1 }}
        />
      ))}
    </motion.svg>
  );
}

const SHAPES = [ShapeOrbs, ShapeSlabs, ShapeStack] as const;

function ServiceCard({
  item,
  index,
}: Readonly<{ item: ServiceItem; index: number }>) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const skin = SKINS[index % SKINS.length];
  const Shape = SHAPES[index % SHAPES.length];
  const panelId = `service-${item.id}-details`;

  // With reduced motion the card stops deforming, but the disclosure still
  // has to work, so only the squish variants are dropped.
  const squishy = prefersReducedMotion ? undefined : "hover";

  return (
    <MotionCard tilt={false} tone={skin.glowTone} radius="1.25rem">
      <motion.div
        whileHover={squishy}
        transition={SQUISH}
        variants={{ hover: { scale: 1.03 } }}
        className={`group relative flex h-full min-h-[26rem] flex-col overflow-hidden rounded-[1.25rem] border p-8 hover:z-10 ${skin.surface} ${skin.border}`}
      >
        <Shape fill={skin.shape} />

        <div className="relative z-10 flex h-full flex-col">
          <span
            className={`mb-5 block w-fit rounded-full border px-3 py-0.5 font-mono text-xs font-bold uppercase tracking-widest ${skin.chip}`}
          >
            {String(index + 1).padStart(2, "0")} — {skin.tag}
          </span>

          {/* The slot the reference fills with a price. A two-word service
              name sits in it far better than "от 120 000 ₽" ever would. */}
          <motion.h3
            initial={prefersReducedMotion ? undefined : { scale: 0.88 }}
            variants={{ hover: { scale: 1 } }}
            transition={SQUISH}
            /*
              Не text-display-sm: тот доходит до 2.75rem, а полезная ширина
              карточки в трёхколоночной сетке — около 291px (1240 контейнера
              минус 128 отступов, делить на три, минус паддинги). «Конверсионные»
              на 44px занимает ~297px и вылезает за край в наведённом состоянии,
              когда заголовок дорастает с 0.88 до единицы. Потолок опущен так,
              чтобы самое длинное слово («AI-автоматизации», ~275px на этом кегле)
              помещалось в строку целиком: переносить его нельзя — Chrome рвёт
              русские слова вроде «Конверси-онные».
            */
            className={`origin-top-left text-balance text-[clamp(1.5rem,2.1vw,1.9rem)] font-bold leading-[1.06] tracking-tight ${skin.title}`}
          >
            {item.title}
          </motion.h3>

          <p className={`mt-5 text-base leading-relaxed ${skin.body}`}>
            {item.whenNeeded}
          </p>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                id={panelId}
                key="details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className={`mt-6 space-y-5 border-t pt-6 ${skin.rule}`}>
                  <div>
                    <p
                      className={`text-xs font-bold uppercase tracking-wider ${skin.label}`}
                    >
                      Что делаем
                    </p>
                    <p className={`mt-2 text-sm leading-relaxed ${skin.body}`}>
                      {item.whatWeDo}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold uppercase tracking-wider ${skin.label}`}
                    >
                      Что получает бизнес
                    </p>
                    <p className={`mt-2 text-sm leading-relaxed ${skin.body}`}>
                      {item.businessOutcome}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* mt-auto, so the pill sits on the card floor the way it does in
              the reference instead of riding up under a short paragraph. */}
          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls={panelId}
              className={`flex h-12 w-full items-center justify-center rounded-lg font-mono text-sm font-black uppercase tracking-wider transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${skin.button}`}
            >
              {open ? "Свернуть" : "Подробнее"}
            </button>
          </div>
        </div>
      </motion.div>
    </MotionCard>
  );
}

export default function ServicesSquishySection() {
  const content = homeContent.services;

  return (
    <section
      id="services"
      className="py-section-mobile md:py-section-desktop bg-transparent text-white"
    >
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />

        <MotionGrid
          className="mt-14 grid items-stretch gap-6 md:mt-16 lg:grid-cols-3"
          staggerDelay={0.12}
        >
          {content.items.map((item, index) => (
            <ServiceCard key={item.id} item={item} index={index} />
          ))}
        </MotionGrid>

        <div className="mt-12 text-center md:text-left">
          <a
            href="#contact"
            className="inline-flex h-14 items-center justify-center rounded-full bg-white px-9 text-base font-semibold text-[#101114] shadow-lg transition-all hover:scale-105 hover:bg-white/90 active:scale-95"
          >
            {content.cta}
          </a>
        </div>
      </SectionContainer>
    </section>
  );
}
