"use client";

/**
 * Знак ожидания.
 *
 * Обычный спиннер говорит «страница грузится» и через минуту начинает
 * раздражать. Здесь другое сообщение: расходящиеся круги — заявка ушла,
 * медленное кольцо — работа идёт, дышащее ядро — приложение живо. Движение
 * намеренно неспешное: торопить человека, который уже всё сделал, незачем.
 *
 * Один знак на два экрана — пока разбор считается и пока заявка ждёт ответа:
 * это одно и то же состояние для того, кто смотрит.
 */

const RING_MASK =
  "radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))";

export function WaitingMark() {
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="absolute inset-0 animate-[halo_5400ms_cubic-bezier(0.22,1,0.36,1)_infinite] rounded-full border border-white/25"
          style={{ animationDelay: `${index * 1800}ms` }}
        />
      ))}

      <span className="absolute h-20 w-20 rounded-full bg-white/[0.07] blur-2xl" />

      {/* Свет, бегущий по кольцу: конический градиент, обрезанный маской до
          линии в полтора пикселя. */}
      <span
        className="absolute inset-10 animate-[turn_7s_linear_infinite] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(236,238,242,0) 0deg, rgba(236,238,242,0) 190deg, rgba(236,238,242,0.45) 320deg, rgba(236,238,242,0.95) 360deg)",
          WebkitMaskImage: RING_MASK,
          maskImage: RING_MASK,
        }}
      />

      {/* Спутник идёт по той же орбите, но быстрее: два несовпадающих периода
          не дают движению выглядеть заводным. */}
      <span className="absolute inset-10 animate-[turn_4400ms_linear_infinite]">
        <span className="absolute top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_2px_rgba(236,238,242,0.5)]" />
      </span>

      <span className="h-2.5 w-2.5 animate-[breathe_2800ms_ease-in-out_infinite] rounded-full bg-white" />
    </div>
  );
}
