import { describe, expect, it } from "vitest";

import {
  analysisFailedMessage,
  analysisReadyMessage,
  fallbackMessage,
  greetingMessage,
  helpMessage,
  MESSAGE_LIMIT,
  parseCommand,
} from "@/lib/telegram/messages";

// Сообщения бота — единственное, что остаётся у человека после закрытия
// мини-аппа. Проверяем то, что ломает их молча: экранирование, длину и разбор
// команды.

describe("сообщения о брифе", () => {
  it("зовут в приложение, а не пересказывают разбор", () => {
    const text = analysisReadyMessage();

    expect(text).toContain("Бриф принят, разбор готов");
    expect(text).toContain("в приложении");
    expect(text).toContain("на рассмотрении");
    // В чате — событие, содержание — на экране: длинного текста здесь быть
    // не должно, иначе сообщение снова превратится в рассылку.
    expect(text.length).toBeLessThan(600);
  });

  it("не молчат, когда разбор собрать не удалось", () => {
    expect(analysisFailedMessage()).toContain("Бриф получен");
  });
});

describe("greetingMessage", () => {
  it("зовёт к брифу того, у кого заявки ещё нет", () => {
    const text = greetingMessage("Фёдор", null);

    expect(text).toContain("Здравствуйте, Фёдор!");
    expect(text).toContain("nyraflow desk");
    expect(text).toContain("восемь вопросов");
  });

  it("обходится без имени, если Telegram его не прислал", () => {
    expect(greetingMessage(null, null).startsWith("Здравствуйте!")).toBe(true);
  });

  it("говорит о готовом разборе тому, кто бриф уже отправил", () => {
    const text = greetingMessage("Фёдор", { status: "new", hasAnalysis: true });

    expect(text).toContain("бриф у нас");
    expect(text).toContain("перечитать");
  });

  it("зовёт в кабинет, когда проект уже в работе", () => {
    const text = greetingMessage(null, { status: "in_work", hasAnalysis: true });

    expect(text).toContain("проект в работе");
  });

  it("экранирует имя: в нём может оказаться что угодно", () => {
    expect(greetingMessage("<script>", null)).toContain("&lt;script&gt;");
  });
});

describe("parseCommand", () => {
  it("узнаёт команду с упоминанием бота и полезной нагрузкой", () => {
    expect(parseCommand("/start")).toBe("start");
    expect(parseCommand("  /Start@nyraflow_bot ref=site ")).toBe("start");
    expect(parseCommand("/help")).toBe("help");
  });

  it("обычный текст командой не считает", () => {
    expect(parseCommand("привет, нужен сайт")).toBeNull();
    expect(parseCommand("")).toBeNull();
  });
});

describe("остальные тексты", () => {
  it("укладываются в предел сообщения", () => {
    expect(helpMessage().length).toBeLessThanOrEqual(MESSAGE_LIMIT);
    expect(fallbackMessage().length).toBeLessThanOrEqual(MESSAGE_LIMIT);
    expect(helpMessage()).toContain("/start");
  });
});
