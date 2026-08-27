import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Стандартный shadcn-хелпер: склеивает классы и разрешает конфликты Tailwind,
 * чтобы класс, переданный снаружи компонента, побеждал класс по умолчанию.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
