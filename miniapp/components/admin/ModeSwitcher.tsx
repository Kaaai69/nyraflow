"use client";

import { haptic } from "@/lib/telegram/webapp";

// Переключатель режимов для команды.
//
// Раньше это были плавающие кнопки поверх содержимого — и они наезжали то на
// панель статусов в карточке заявки, то на элементы кабинета. Плавающий
// элемент неизбежно с чем-то пересекается: экранов много, а он один и знает
// только про себя.
//
// Здесь он занимает собственную строку в потоке документа. Наезжать больше
// не на что, в каком бы состоянии ни был экран под ним.

export type AppMode = "admin" | "project" | "brief";

const MODES: { id: AppMode; label: string }[] = [
  { id: "admin", label: "Заявки" },
  { id: "project", label: "Кабинет" },
  { id: "brief", label: "Бриф" },
];

type Props = {
  current: AppMode;
  onChange: (mode: AppMode) => void;
};

export function ModeSwitcher({ current, onChange }: Props) {
  return (
    <div className="shrink-0 border-b border-white/10 px-4 py-2.5">
      <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
        {MODES.map((mode) => {
          const active = mode.id === current;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                if (active) return;
                haptic("light");
                onChange(mode.id);
              }}
              className={`flex-1 rounded-full py-2 text-sm transition-colors ${
                active ? "bg-white font-medium text-black" : "text-white/60"
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
