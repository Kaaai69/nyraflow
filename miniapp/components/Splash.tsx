"use client";

// Заставка.
//
// Появляется не мгновенно и уходит не обрывом: название проявляется из
// размытия, под ним подтягивается подпись, и только потом экран уступает
// место приложению. Пара секунд здесь стоит того — это первое, что человек
// видит, открыв мини-апп, и единственное место, где студия представляется.

type Props = { leaving: boolean };

export function Splash({ leaving }: Props) {
  return (
    <div
      aria-hidden={leaving}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 px-8 ${
        leaving
          ? "pointer-events-none animate-[recede_800ms_cubic-bezier(0.22,1,0.36,1)_both]"
          : "opacity-100"
      }`}
    >
      <h1 className="animate-[emerge_1100ms_cubic-bezier(0.22,1,0.36,1)_both] text-[2.75rem] leading-none font-medium lowercase">
        nyraflow
      </h1>

      <p className="animate-[fade-up_700ms_cubic-bezier(0.22,1,0.36,1)_600ms_both] text-center text-sm leading-relaxed text-white/40">
        Сайты, веб-сервисы и AI-автоматизация
      </p>
    </div>
  );
}
