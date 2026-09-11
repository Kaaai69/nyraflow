"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

import { homeContent } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";
import {
  ambientIndex,
  createAutomationSheets,
  resolveFanPosition,
} from "./serviceVisualGeometry";

type ServiceItem = (typeof homeContent.services.items)[number];

// Секция лежит на общем анимированном фоне страницы (BackgroundFlowField), а не
// на своей заливке, поэтому линии рисуем светом: тонкая обводка + мягкое
// свечение. С прежними значениями (.48/.17 по непрозрачной подложке) графика
// на облаках просто пропадала, и блок читался как чёрное пятно.
const STROKE = "rgba(236,238,242,.82)";
const STROKE_SOFT = "rgba(236,238,242,.3)";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

/**
 * Рисунок живёт сам: индекс ходит волной, пока на него не навели. Курсор
 * перехватывает управление, уход курсора возвращает волну.
 */
function usePointerIndex(count: number, periodMs: number, phaseMs: number) {
  const reduced = usePrefersReducedMotion();
  const [ambient, setAmbient] = useState(() => Math.floor(count / 2));
  const [pointer, setPointer] = useState<number | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    if (reduced || pointer !== null) return;

    const tick = () => {
      setAmbient(ambientIndex(performance.now(), count, periodMs, phaseMs));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [count, periodMs, phaseMs, pointer, reduced]);

  return { index: pointer ?? ambient, setPointer };
}

type VisualFrameProps = Readonly<{
  label: string;
  children: ReactNode;
  onPointerMove?: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerLeave?: () => void;
  pointerDriven?: boolean;
}>;

function VisualFrame({
  label,
  children,
  onPointerMove,
  onPointerLeave,
  pointerDriven = false,
}: VisualFrameProps) {
  return (
    <svg
      viewBox="0 0 320 240"
      role="img"
      aria-label={label}
      data-pointer-driven={pointerDriven ? "true" : undefined}
      className="service-visual h-full w-full touch-pan-y overflow-visible"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </svg>
  );
}

const STACK_LAYERS = 5;

function WebsiteStack() {
  const { index, setPointer } = usePointerIndex(STACK_LAYERS, 5200, 0);

  function updateLayer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const progress = Math.min(
      0.999,
      Math.max(0, (event.clientY - bounds.top) / bounds.height),
    );
    setPointer(STACK_LAYERS - 1 - Math.floor(progress * STACK_LAYERS));
  }

  return (
    <VisualFrame
      label="Слои страницы: подсветка проходит снизу вверх и следует за курсором"
      pointerDriven
      onPointerMove={updateLayer}
      onPointerLeave={() => setPointer(null)}
    >
      {Array.from({ length: STACK_LAYERS }, (_, layer) => {
        const y = 156 - layer * 24;
        const distance = Math.abs(index - layer);
        const lift = Math.max(0, 16 - distance * 7);
        const active = distance === 0;
        return (
          <g
            key={layer}
            style={{
              transform: `translateY(${-lift}px)`,
              transition: "transform 260ms cubic-bezier(.22,1,.36,1)",
            }}
          >
            <path
              d={`M 46 ${y} L 160 ${y - 60} L 274 ${y} L 160 ${y + 60} Z`}
              fill={active ? "rgba(236,238,242,.07)" : "rgba(0,0,0,.3)"}
              stroke={active ? STROKE : STROKE_SOFT}
              strokeWidth={active ? 1.4 : 0.9}
              style={{ transition: "stroke 260ms ease, stroke-width 260ms ease" }}
            />
            <path
              d={`M 46 ${y} L 46 ${y + 13} L 160 ${y + 73} L 160 ${y + 60} Z`}
              fill="rgba(236,238,242,.03)"
              stroke={STROKE_SOFT}
              strokeWidth=".9"
            />
            <path
              d={`M 160 ${y + 60} L 160 ${y + 73} L 274 ${y + 13} L 274 ${y} Z`}
              fill="rgba(0,0,0,.34)"
              stroke={STROKE_SOFT}
              strokeWidth=".9"
            />
            {/* На верхнем слое — то, ради чего страницу открыли: заголовок и
                кнопка. Рисуем внутри его группы, чтобы они поднимались вместе
                с ним, а не отрывались при подсветке. */}
            {layer === STACK_LAYERS - 1 ? (
              <g fill="none">
                <path
                  d={`M 122 ${y - 16} H 198 M 130 ${y - 8} H 190`}
                  stroke={STROKE}
                  strokeWidth="1.3"
                />
                <path
                  d={`M 138 ${y + 6} L 160 ${y - 5} L 182 ${y + 6} L 160 ${y + 17} Z`}
                  stroke={STROKE}
                  strokeWidth="1.3"
                  fill="rgba(236,238,242,.14)"
                />
              </g>
            ) : null}
          </g>
        );
      })}
    </VisualFrame>
  );
}

function IsoModule({
  x,
  y,
  width,
  height,
  active,
}: Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}>) {
  const depth = width * 0.47;
  return (
    <g
      style={{
        transform: `translateY(${active ? -8 : 0}px)`,
        transition: "transform 420ms cubic-bezier(.22,1,.36,1)",
      }}
    >
      <path
        d={`M ${x} ${y + depth / 2} L ${x + width / 2} ${y} L ${x + width} ${y + depth / 2} L ${x + width / 2} ${y + depth} Z`}
        fill={active ? "rgba(236,238,242,.1)" : "rgba(236,238,242,.03)"}
        stroke={active ? STROKE : STROKE_SOFT}
        strokeWidth={active ? 1.35 : 0.95}
        style={{ transition: "stroke 420ms ease, fill 420ms ease" }}
      />
      <path
        d={`M ${x} ${y + depth / 2} L ${x} ${y + depth / 2 + height} L ${x + width / 2} ${y + depth + height} L ${x + width / 2} ${y + depth} Z`}
        fill="rgba(236,238,242,.02)"
        stroke={STROKE_SOFT}
        strokeWidth=".95"
      />
      <path
        d={`M ${x + width / 2} ${y + depth} L ${x + width / 2} ${y + depth + height} L ${x + width} ${y + depth / 2 + height} L ${x + width} ${y + depth / 2} Z`}
        fill="rgba(0,0,0,.32)"
        stroke={STROKE_SOFT}
        strokeWidth=".95"
      />
    </g>
  );
}

const MODULES = [
  { x: 112, y: 22, width: 92, height: 40 },
  { x: 40, y: 88, width: 92, height: 54 },
  { x: 184, y: 88, width: 92, height: 54 },
  { x: 112, y: 150, width: 92, height: 42 },
] as const;

function SystemModules() {
  const { index } = usePointerIndex(MODULES.length, 6400, 900);

  return (
    <VisualFrame label="Модули сервиса и связи между ними: сигнал идёт по очереди">
      {MODULES.map((module, moduleIndex) => (
        <IsoModule
          key={module.x + ":" + module.y}
          {...module}
          active={moduleIndex === index}
        />
      ))}
      {/* Связи идут от вершины к вершине через пустоту, поэтому рисуются
          поверх модулей и ничего не перекрывают. Бегущий пунктир — то, ради
          чего блок вообще существует: процесс, а не набор коробок. */}
      <path
        d="M 112 44 L 86 88 M 204 44 L 230 88 M 132 110 L 112 172 M 184 110 L 204 172"
        stroke={STROKE_SOFT}
        strokeWidth="1.1"
        strokeDasharray="3 6"
        className="service-link-pulse"
        fill="none"
      />
    </VisualFrame>
  );
}

const SHEET_COUNT = 15;

function AutomationFan() {
  const { index, setPointer } = usePointerIndex(SHEET_COUNT, 7600, 2100);
  const sheets = createAutomationSheets(index);

  return (
    <VisualFrame
      label="Поток однотипных задач: волна проходит по стопке и следует за курсором"
      pointerDriven
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointer(
          resolveFanPosition(event.clientX, bounds.left, bounds.width, SHEET_COUNT),
        );
      }}
      onPointerLeave={() => setPointer(null)}
    >
      <g transform="translate(24 -6)">
        {sheets.map((sheet, sheetIndex) => (
          <path
            key={sheetIndex}
            d={sheet.d}
            fill="none"
            stroke="#ECEEF2"
            strokeOpacity={sheet.opacity}
            strokeWidth={Math.abs(sheetIndex - index) < 2 ? 1.4 : 0.9}
            style={{
              transform: `translateY(${-sheet.lift}px)`,
              transition:
                "transform 200ms cubic-bezier(.22,1,.36,1), stroke-width 200ms ease, stroke-opacity 200ms ease",
            }}
          />
        ))}
      </g>
    </VisualFrame>
  );
}

const VISUALS = [WebsiteStack, SystemModules, AutomationFan] as const;

// Эйбрау повторяет тройку из описания секции — «продажи, сервис или внутренний
// процесс». Это то, что у клиента меняется после запуска, поэтому колонки можно
// пробежать глазами, не читая абзацы. Нумерация здесь была бы враньём: три
// формата — альтернативы, а не шаги.
const OUTCOMES = ["Продажи", "Сервис", "Процесс"] as const;

function ServicePanel({ item, index }: Readonly<{ item: ServiceItem; index: number }>) {
  const Visual = VISUALS[index];
  return (
    <article className="service-panel flex min-w-0 flex-col border-t border-white/[.09] py-10 first:border-t-0 md:border-t-0 md:border-l md:px-9 md:py-0 md:first:border-l-0 md:first:pl-0 md:last:pr-0">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">
        {OUTCOMES[index]}
      </p>
      <div className="service-visual-frame relative mt-6 h-[14rem] w-full select-none md:h-[15rem]">
        <Visual />
      </div>
      <div className="mt-7 flex flex-1 flex-col">
        <h3 className="text-[1.6rem] font-bold leading-[1.12] tracking-[-0.02em] text-white md:text-[1.75rem]">
          {item.title}
        </h3>
        <p className="mt-4 text-base leading-[1.65] text-white/65">{item.whenNeeded}</p>
        <details className="group mt-8 border-t border-white/[.09] pt-4 md:mt-auto">
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-medium text-white/80 transition-colors marker:content-none hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span>Что делаем и что получает бизнес</span>
            <span
              aria-hidden="true"
              className="ml-4 text-lg font-light leading-none text-white/50 transition-transform duration-300 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="space-y-5 pb-1 pt-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                Что делаем
              </p>
              <p className="mt-2 text-sm leading-[1.7] text-white/60">{item.whatWeDo}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                Что получает бизнес
              </p>
              <p className="mt-2 text-sm leading-[1.7] text-white/60">
                {item.businessOutcome}
              </p>
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
    <section
      id="services"
      className="py-section-mobile text-white md:py-section-desktop"
    >
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />
        <div className="mt-14 grid border-y border-white/[.09] md:mt-20 md:grid-cols-3 md:py-14">
          {content.items.map((item, index) => (
            <ServicePanel key={item.id} item={item} index={index} />
          ))}
        </div>
        <div className="mt-10 md:mt-12">
          <a
            href="#contact"
            className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[#101114] transition-transform duration-200 hover:scale-[1.03]"
          >
            {content.cta}
          </a>
        </div>
      </SectionContainer>
      <style jsx global>{`
        /* Рисунок лежит на живом облачном фоне, поэтому линии светятся, а под
           ними — локальное затемнение: без него обводка тонет в светлых
           участках облаков, а сплошная заливка секции убивала фон целиком. */
        .service-visual-frame::before {
          content: "";
          position: absolute;
          inset: -12% -6%;
          background: radial-gradient(
            60% 55% at 50% 52%,
            rgba(0, 0, 0, 0.62) 0%,
            rgba(0, 0, 0, 0.28) 55%,
            rgba(0, 0, 0, 0) 100%
          );
          pointer-events: none;
        }
        .service-visual {
          position: relative;
          filter: drop-shadow(0 0 6px rgba(236, 238, 242, 0.22));
        }
        .service-link-pulse {
          animation: service-link-flow 3.4s linear infinite;
        }
        @keyframes service-link-flow {
          from {
            stroke-dashoffset: 18;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .service-link-pulse {
            animation: none;
          }
          .service-visual g,
          .service-visual path {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}
