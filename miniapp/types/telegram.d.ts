// Минимальная типизация Telegram WebApp API — только то, что реально
// используем. Полный SDK тянуть незачем: интерфейс стабилен и невелик.

type TelegramHapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";

type TelegramWebApp = {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
    start_param?: string;
  };
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportStableHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  openTelegramLink: (url: string) => void;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: TelegramHapticStyle) => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
  };
};

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}
