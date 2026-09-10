"use client";

import { useState, type PointerEvent } from "react";

import { homeContent } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";
import {
  createAutomationSheets,
  resolveFanPosition,
} from "./serviceVisualGeometry";

type ServiceItem = (typeof homeContent.services.items)[number];

const STROKE = "rgba(236,238,242,.48)";
const STROKE_SOFT = "rgba(236,238,242,.17)";

function WebsiteStack() {
  const [activeLayer, setActiveLayer] = useState(4);
  const layers = Array.from({ length: 6 }, (_, index) => index);

  function updateLayer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const progress = Math.min(
      0.999,
      Math.max(0, (event.clientY - bounds.top) / bounds.height),
    );
    setActiveLayer(5 - Math.floor(progress * 6));
  }

  return (
    <svg
      viewBox="0 0 320 260"
      role="img"
      aria-label="Слои интерфейса реагируют на положение указателя"
      className="h-full w-full touch-pan-y overflow-visible"
      onPointerMove={updateLayer}
      onPointerLeave={() => setActiveLayer(4)}
    >
      <defs>
        <linearGradient id="web-top" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ECEEF2" stopOpacity=".075" />
          <stop offset="1" stopColor="#ECEEF2" stopOpacity=".012" />
        </linearGradient>
      </defs>
      {layers.map((index) => {
        const y = 136 - index * 17;
        const distance = Math.abs(activeLayer - index);
        const lift = Math.max(0, 12 - distance * 4);
        return (
          <g
            key={index}
            style={{
              transform: `translateY(${-lift}px)`,
              transition: "transform 240ms cubic-bezier(.22,1,.36,1)",
            }}
          >
            <path
              d={`M 55 ${y} L 160 ${y - 55} L 266 ${y} L 160 ${y + 55} Z`}
              fill={index === 5 ? "url(#web-top)" : "rgba(0,0,0,.22)"}
              stroke={index === activeLayer ? STROKE : STROKE_SOFT}
              strokeWidth={index === activeLayer ? 1.2 : 0.85}
            />
            <path
              d={`M 55 ${y} L 55 ${y + 12} L 160 ${y + 67} L 160 ${y + 55} Z`}
              fill="rgba(236,238,242,.018)"
              stroke={STROKE_SOFT}
              strokeWidth=".8"
            />
            <path
              d={`M 160 ${y + 55} L 160 ${y + 67} L 266 ${y + 12} L 266 ${y} Z`}
              fill="rgba(236,238,242,.01)"
              stroke={STROKE_SOFT}
              strokeWidth=".8"
            />
          </g>
        );
      })}
      <g transform="translate(0 -11)" fill="none">
        <ellipse cx="160" cy="87" rx="42" ry="21" stroke={STROKE_SOFT} />
        <path d="M 119 87 H 201 M 126 94 H 194 M 136 101 H 184" stroke={STROKE} />
      </g>
    </svg>
  );
}

function DotScreen({ x, y, delay = 0 }: Readonly<{ x: number; y: number; delay?: number }>) {
  return (
    <g transform={`translate(${x} ${y}) rotate(27)`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => {
        const column = index % 4;
        const row = Math.floor(index / 4);
        return (
          <circle
            key={index}
            cx={column * 3.2}
            cy={row * 3.2}
            r=".75"
            fill="#ECEEF2"
            className="service-screen-dot"
            style={{ animationDelay: `${delay + index * 70}ms` }}
          />
        );
      })}
    </g>
  );
}

function IsoModule({
  x,
  y,
  width,
  height,
  screen,
  delay,
}: Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  screen?: boolean;
  delay: number;
}>) {
  const depth = width * 0.47;
  const side = 18;
  return (
    <g
      style={{
        transformOrigin: `${x + width / 2}px ${y + depth / 2}px`,
        animationDelay: `${delay}ms`,
      }}
      className="service-system-module"
    >
      <path
        d={`M ${x} ${y + depth / 2} L ${x + width / 2} ${y} L ${x + width} ${y + depth / 2} L ${x + width / 2} ${y + depth} Z`}
        fill="rgba(236,238,242,.025)"
        stroke={STROKE}
      />
      <path
        d={`M ${x} ${y + depth / 2} L ${x} ${y + depth / 2 + height} L ${x + width / 2} ${y + depth + height} L ${x + width / 2} ${y + depth} Z`}
        fill="rgba(236,238,242,.012)"
        stroke={STROKE_SOFT}
      />
      <path
        d={`M ${x + width / 2} ${y + depth} L ${x + width / 2} ${y + depth + height} L ${x + width} ${y + depth / 2 + height} L ${x + width} ${y + depth / 2} Z`}
        fill="rgba(0,0,0,.18)"
        stroke={STROKE_SOFT}
      />
      {screen ? <DotScreen x={x + width * 0.63} y={y + 5} delay={delay} /> : null}
      <path
        d={`M ${x + width * 0.78} ${y + depth / 2 + height - side} l 8 4`}
        stroke={STROKE_SOFT}
      />
    </g>
  );
}

function SystemModules() {
  return (
    <svg
      viewBox="0 0 320 260"
      role="img"
      aria-label="Связанные модули веб-сервиса"
      className="h-full w-full overflow-visible"
    >
      <IsoModule x={116} y={36} width={90} height={46} screen delay={0} />
      <IsoModule x={48} y={103} width={91} height={66} screen delay={100} />
      <IsoModule x={184} y={104} width={88} height={63} delay={210} />
      <IsoModule x={116} y={158} width={94} height={48} screen delay={320} />
      <path
        d="M 161 91 V 110 M 111 155 L 143 171 M 211 154 L 186 170"
        stroke={STROKE_SOFT}
        strokeDasharray="2 5"
      />
    </svg>
  );
}

function AutomationFan() {
  const [activeIndex, setActiveIndex] = useState(7);
  const sheets = createAutomationSheets(activeIndex);

  function updateFan(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setActiveIndex(resolveFanPosition(event.clientX, bounds.left, bounds.width));
  }

  return (
    <svg
      viewBox="0 0 260 260"
      role="img"
      aria-label="Автоматизация следует за движением курсора или пальца"
      data-pointer-driven="true"
      className="h-full w-full touch-pan-y overflow-visible"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFan(event);
      }}
      onPointerMove={updateFan}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => setActiveIndex(7)}
      onPointerLeave={() => setActiveIndex(7)}
    >
      {sheets.map((sheet, index) => (
        <path
          key={index}
          d={sheet.d}
          fill="none"
          stroke="#ECEEF2"
          strokeOpacity={sheet.opacity}
          strokeWidth={Math.abs(index - activeIndex) < 2 ? 1.15 : 0.8}
          style={{
            transform: `translateY(${-sheet.lift}px)`,
            transition: "transform 170ms cubic-bezier(.22,1,.36,1), stroke-width 170ms ease",
          }}
        />
      ))}
    </svg>
  );
}

const VISUALS = [WebsiteStack, SystemModules, AutomationFan] as const;
const LABELS = ["Web", "System", "Automation"] as const;

function ServicePanel({ item, index }: Readonly<{ item: ServiceItem; index: number }>) {
  const Visual = VISUALS[index];
  return (
    <article className="service-panel flex min-w-0 flex-col border-t border-white/[.11] py-10 first:border-t-0 md:border-t-0 md:border-l md:px-8 md:py-0 md:first:border-l-0 md:first:pl-0 md:last:pr-0">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/38">
        {LABELS[index]}
      </p>
      <div className="mt-5 h-[17rem] w-full select-none md:h-[19rem]">
        <Visual />
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-2xl font-semibold leading-tight tracking-[-0.025em] text-white md:text-[1.7rem]">
          {item.title}
        </h3>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/38">
          Когда нужны
        </p>
        <p className="mt-2 text-[15px] leading-7 text-white/58">{item.whenNeeded}</p>
        <details className="group mt-7 border-t border-white/[.11] pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-medium text-white/78 marker:content-none">
            <span>Подробнее</span>
            <span aria-hidden="true" className="text-lg font-light text-white/45 group-open:rotate-45">+</span>
          </summary>
          <div className="space-y-5 pb-2 pt-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/38">Что делаем</p>
              <p className="mt-2 text-sm leading-6 text-white/58">{item.whatWeDo}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/38">Что получает бизнес</p>
              <p className="mt-2 text-sm leading-6 text-white/58">{item.businessOutcome}</p>
            </div>
          </div>
        </details>
      </div>
    </article>
  );
}

export default function ServicesSquishySection() {
  const content = homeContent.services;
  return (
    <section id="services" className="bg-[#070809] py-section-mobile text-white md:py-section-desktop">
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />
        <div className="mt-14 grid border-y border-white/[.11] md:mt-20 md:grid-cols-3 md:py-12">
          {content.items.map((item, index) => (
            <ServicePanel key={item.id} item={item} index={index} />
          ))}
        </div>
        <div className="mt-10 md:mt-12">
          <a
            href="#contact"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white px-7 text-sm font-semibold text-[#101114] transition-transform hover:scale-[1.03]"
          >
            {content.cta}
          </a>
        </div>
      </SectionContainer>
      <style jsx global>{`
        .service-screen-dot {
          animation: screen-pulse 2.2s ease-in-out infinite alternate;
        }
        .service-system-module {
          animation: module-breathe 4.8s cubic-bezier(.22,1,.36,1) infinite alternate;
        }
        @keyframes screen-pulse {
          0%, 30% { opacity: .18; }
          75%, 100% { opacity: .9; }
        }
        @keyframes module-breathe {
          from { transform: translateY(0); }
          to { transform: translateY(-5px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .service-screen-dot,
          .service-system-module {
            animation: none;
          }
          path { transition: none !important; }
        }
      `}</style>
    </section>
  );
}
