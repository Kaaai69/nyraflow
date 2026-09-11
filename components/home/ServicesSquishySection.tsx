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
  boxFaces,
  project,
  resolveFanPosition,
  topFaceRect,
  waveLift,
  type IsoBox,
  type IsoView,
} from "./serviceVisualGeometry";

type ServiceItem = (typeof homeContent.services.items)[number];

// Тела непрозрачные: дальние грани закрываются ближними, и объект читается как
// объём, а не как просвечивающий каркас. Разница светлоты между тремя гранями —
// единственный источник объёма в монохроме, поэтому она фиксирована здесь.
const FACE_TOP = "#191B20";
const FACE_TOP_ACTIVE = "#31343D";
const FACE_LEFT = "#101116";
const FACE_RIGHT = "#0A0B0E";
const EDGE = "rgba(236,238,242,.5)";
const EDGE_ACTIVE = "rgba(236,238,242,.95)";
const EDGE_SOFT = "rgba(236,238,242,.34)";

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
 * Рисунок живёт сам: волна ходит от края к краю, пока на него не навели. Курсор
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

const LIFT_TRANSITION = "transform 380ms cubic-bezier(.22,1,.36,1)";

function IsoBody({
  box,
  view,
  active,
  lift,
  children,
}: Readonly<{
  box: IsoBox;
  view: IsoView;
  active: boolean;
  lift: number;
  children?: ReactNode;
}>) {
  const faces = boxFaces(box, view);
  return (
    <g style={{ transform: `translateY(${-lift}px)`, transition: LIFT_TRANSITION }}>
      <path d={faces.left} fill={FACE_LEFT} stroke={EDGE_SOFT} strokeWidth=".9" />
      <path d={faces.right} fill={FACE_RIGHT} stroke={EDGE_SOFT} strokeWidth=".9" />
      <path
        d={faces.top}
        fill={active ? FACE_TOP_ACTIVE : FACE_TOP}
        stroke={active ? EDGE_ACTIVE : EDGE}
        strokeWidth={active ? 1.3 : 0.95}
        style={{ transition: "fill 380ms ease, stroke 380ms ease" }}
      />
      {children}
    </g>
  );
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
      className="service-visual h-full w-full touch-pan-y"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </svg>
  );
}

// --- Конверсионные сайты: стопка слоёв страницы -----------------------------

const STACK_VIEW: IsoView = { scale: 21.5, originX: 160, originY: 108 };
const STACK_COUNT = 5;
const STACK_PLATE = { w: 5.6, d: 5.6, h: 0.55 };
const STACK_STEP = 0.9;

function WebsiteStack() {
  const { index, setPointer } = usePointerIndex(STACK_COUNT, 5200, 0);

  function updateLayer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const progress = Math.min(
      0.999,
      Math.max(0, (event.clientY - bounds.top) / bounds.height),
    );
    setPointer(STACK_COUNT - 1 - Math.floor(progress * STACK_COUNT));
  }

  return (
    <VisualFrame
      label="Слои страницы: подсветка проходит снизу вверх и следует за курсором"
      pointerDriven
      onPointerMove={updateLayer}
      onPointerLeave={() => setPointer(null)}
    >
      {Array.from({ length: STACK_COUNT }, (_, layer) => {
        const box: IsoBox = { x: 0, y: 0, z: layer * STACK_STEP, ...STACK_PLATE };
        const active = layer === index;
        const top = layer === STACK_COUNT - 1;
        return (
          <IsoBody
            key={layer}
            box={box}
            view={STACK_VIEW}
            active={active}
            lift={waveLift(layer, index, 2.4, 13)}
          >
            {/* На верхней плите — то, ради чего страницу открыли: блок контента
                и кнопка. Рисуем внутри её группы, чтобы поднимались вместе. */}
            {top ? (
              <>
                <path
                  d={topFaceRect(box, STACK_VIEW, 0.8, 0.8, box.w - 0.8, 2.6)}
                  fill="none"
                  stroke={EDGE}
                  strokeWidth=".9"
                />
                <path
                  d={topFaceRect(box, STACK_VIEW, 0.8, 3.3, 2.9, 4.4)}
                  fill="rgba(236,238,242,.2)"
                  stroke={EDGE_ACTIVE}
                  strokeWidth=".9"
                />
              </>
            ) : null}
          </IsoBody>
        );
      })}
    </VisualFrame>
  );
}

// --- Веб-сервисы: связанные модули ------------------------------------------

const MODULE_VIEW: IsoView = { scale: 18, originX: 160, originY: 55 };

// Модули не пересекаются в мировых координатах — иначе ближний врезается в
// дальний и объём снова разваливается. Между ними остаются промежутки, и
// именно в них видно связь, которая идёт по полу.
const MODULES: readonly IsoBox[] = [
  { x: 1.9, y: 1.9, z: 0, w: 2.8, d: 2.8, h: 2.6 },
  { x: 0, y: 5.2, z: 0, w: 2.5, d: 2.5, h: 1.9 },
  { x: 5.2, y: 0, z: 0, w: 2.5, d: 2.5, h: 1.9 },
  { x: 5, y: 5, z: 0, w: 2.8, d: 2.8, h: 2.3 },
];

function indicatorDots(box: IsoBox, view: IsoView) {
  return [0, 1, 2].map((step) =>
    project(box.x + 0.45 + step * 0.42, box.y + 0.5, box.z + box.h, view),
  );
}

function groundLink(from: IsoBox, to: IsoBox, view: IsoView) {
  const [x1, y1] = project(from.x + from.w / 2, from.y + from.d / 2, 0, view);
  const [x2, y2] = project(to.x + to.w / 2, to.y + to.d / 2, 0, view);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function SystemModules() {
  const { index } = usePointerIndex(MODULES.length, 6000, 900);

  return (
    <VisualFrame label="Модули сервиса и связи между ними: сигнал идёт по очереди">
      {/* Связи лежат на полу и рисуются первыми — модули их перекрывают, как и
          положено объёмным телам. Видны они в промежутках, и по ним бежит
          пунктир: блок про процесс, а не про набор коробок. */}
      <path
        d={[
          groundLink(MODULES[0], MODULES[1], MODULE_VIEW),
          groundLink(MODULES[0], MODULES[2], MODULE_VIEW),
          groundLink(MODULES[1], MODULES[3], MODULE_VIEW),
          groundLink(MODULES[2], MODULES[3], MODULE_VIEW),
        ].join(" ")}
        fill="none"
        stroke={EDGE_SOFT}
        strokeWidth="1.1"
        strokeDasharray="3 6"
        className="service-link-pulse"
      />
      {MODULES.map((box, moduleIndex) => {
        const active = moduleIndex === index;
        return (
          <IsoBody
            key={`${box.x}:${box.y}`}
            box={box}
            view={MODULE_VIEW}
            active={active}
            lift={active ? 7 : 0}
          >
            {indicatorDots(box, MODULE_VIEW).map(([cx, cy], dot) => (
              <circle
                key={dot}
                cx={cx}
                cy={cy}
                r="1.5"
                fill="#ECEEF2"
                className="service-indicator"
                style={{ animationDelay: `${moduleIndex * 260 + dot * 180}ms` }}
              />
            ))}
          </IsoBody>
        );
      })}
    </VisualFrame>
  );
}

// --- AI-автоматизации: ряд пластин, по которому идёт волна -------------------

const FIN_VIEW: IsoView = { scale: 21, originX: 146, originY: 98 };
const FIN_COUNT = 11;

function AutomationFins() {
  const { index, setPointer } = usePointerIndex(FIN_COUNT, 7200, 2100);

  return (
    <VisualFrame
      label="Поток однотипных задач: волна проходит по пластинам и следует за курсором"
      pointerDriven
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointer(
          resolveFanPosition(event.clientX, bounds.left, bounds.width, FIN_COUNT),
        );
      }}
      onPointerLeave={() => setPointer(null)}
    >
      {Array.from({ length: FIN_COUNT }, (_, fin) => (
        <IsoBody
          key={fin}
          box={{ x: fin * 0.66, y: 0, z: 0, w: 0.3, d: 5, h: 1.35 }}
          view={FIN_VIEW}
          active={fin === index}
          lift={waveLift(fin, index, 3.6, 26)}
        />
      ))}
    </VisualFrame>
  );
}

const VISUALS = [WebsiteStack, SystemModules, AutomationFins] as const;

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
        /* Секция лежит на общем анимированном фоне страницы — своей заливки у
           неё нет. Под рисунком только локальное затемнение, чтобы рёбра не
           тонули в светлых участках облаков. */
        .service-visual-frame::before {
          content: "";
          position: absolute;
          inset: -14% -8%;
          background: radial-gradient(
            58% 54% at 50% 54%,
            rgba(0, 0, 0, 0.55) 0%,
            rgba(0, 0, 0, 0.22) 58%,
            rgba(0, 0, 0, 0) 100%
          );
          pointer-events: none;
        }
        .service-visual {
          position: relative;
          overflow: visible;
        }
        .service-link-pulse {
          animation: service-link-flow 3.4s linear infinite;
        }
        .service-indicator {
          animation: service-indicator-blink 2.6s ease-in-out infinite;
        }
        @keyframes service-link-flow {
          from {
            stroke-dashoffset: 18;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes service-indicator-blink {
          0%,
          62%,
          100% {
            opacity: 0.22;
          }
          20%,
          34% {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .service-link-pulse,
          .service-indicator {
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
